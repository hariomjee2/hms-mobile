import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface Medicine {
  id: string;
  medicineName: string;
  genericName?: string;
  category: string;
  batchNumber: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string;
  manufacturer?: string;
  isLowStock: boolean;
  isExpiringSoon: boolean;
}

const CATEGORIES = ['ALL', 'Antibiotics', 'Analgesics', 'Diabetes', 'Cardiac', 'Gastrointestinal'];

const PharmacyScreen = ({ navigation }: any) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [alerts, setAlerts] = useState<Medicine[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Add Medicine Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [medName, setMedName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Antibiotics');
  const [batchNo, setBatchNo] = useState(`BATCH-${Date.now().toString().slice(-4)}`);
  const [stockQty, setStockQty] = useState('100');
  const [unitPrice, setUnitPrice] = useState('10.00');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [manufacturer, setManufacturer] = useState('PharmaCorp');
  const [submittingMed, setSubmittingMed] = useState(false);

  // Dispense POS Modal State
  const [dispenseModalVisible, setDispenseModalVisible] = useState(false);
  const [selectedMedForDispense, setSelectedMedForDispense] = useState<Medicine | null>(null);
  const [dispenseQty, setDispenseQty] = useState('1');
  const [patientId, setPatientId] = useState('11111111-1111-1111-1111-111111111111');
  const [submittingDispense, setSubmittingDispense] = useState(false);

  useEffect(() => {
    loadPharmacyData();
  }, [selectedCategory, searchQuery]);

  const loadPharmacyData = async () => {
    setLoading(true);
    try {
      let url = '/pharmacy/medicines';
      const params: string[] = [];
      if (selectedCategory !== 'ALL') params.push(`category=${selectedCategory}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (params.length > 0) url += '?' + params.join('&');

      const [medsRes, alertsRes] = await Promise.all([
        apiClient.get(url),
        apiClient.get('/pharmacy/alerts'),
      ]);

      setMedicines(medsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Failed to load pharmacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!medName || !batchNo || !stockQty || !unitPrice) {
      Alert.alert('Missing Details', 'Please fill in Name, Batch, Stock Quantity, and Price.');
      return;
    }

    setSubmittingMed(true);
    try {
      await apiClient.post('/pharmacy/medicines', {
        medicineName: medName.trim(),
        genericName: genericName.trim(),
        category,
        batchNumber: batchNo.trim(),
        stockQuantity: parseInt(stockQty, 10),
        unitPrice: parseFloat(unitPrice),
        expiryDate,
        manufacturer: manufacturer.trim(),
      });

      Alert.alert('🎉 Medicine Added', `${medName} added to inventory.`);
      setAddModalVisible(false);
      loadPharmacyData();
    } catch (error: any) {
      console.error('Add medicine error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Could not save medicine.');
    } finally {
      setSubmittingMed(false);
    }
  };

  const handleOpenDispenseModal = (med: Medicine) => {
    if (med.stockQuantity <= 0) {
      Alert.alert('Out of Stock', `${med.medicineName} is currently out of stock.`);
      return;
    }
    setSelectedMedForDispense(med);
    setDispenseQty('1');
    setDispenseModalVisible(true);
  };

  const handleConfirmDispense = async () => {
    if (!selectedMedForDispense || !dispenseQty || !patientId) {
      Alert.alert('Missing Info', 'Please enter valid quantity and Patient ID.');
      return;
    }

    const qty = parseInt(dispenseQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Quantity must be at least 1.');
      return;
    }

    setSubmittingDispense(true);
    try {
      const res = await apiClient.post('/pharmacy/dispense', {
        patientId: patientId.trim(),
        items: [
          {
            medicineId: selectedMedForDispense.id,
            quantity: qty,
          },
        ],
        notes: `Pharmacy POS Dispense: ${selectedMedForDispense.medicineName} (x${qty})`,
      });

      const dispenseData = res.data;
      setDispenseModalVisible(false);
      loadPharmacyData();

      Alert.alert(
        '💊 Medication Dispensed',
        `Inventory stock deducted successfully.\nTotal Bill: $${dispenseData.totalAmount?.toFixed(2) || '0.00'}`,
        [
          {
            text: 'Pay via UPI QR',
            onPress: () => {
              if (dispenseData.invoiceId) {
                navigation.navigate('PaymentCheckout', {
                  invoiceId: dispenseData.invoiceId,
                  amount: dispenseData.totalAmount,
                  doctorName: 'Hospital Pharmacy POS',
                });
              }
            },
          },
          { text: 'Done' },
        ]
      );
    } catch (error: any) {
      console.error('Dispense error:', error);
      Alert.alert('Dispense Error', error?.response?.data?.message || 'Could not process dispensing.');
    } finally {
      setSubmittingDispense(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Pharmacy & Inventory</Text>
          <Text style={styles.subTitle}>Manage medicine stock, reorder alerts, and POS dispensing</Text>
        </View>
        <TouchableOpacity style={styles.addMedBtn} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.addMedBtnText}>+ Restock Item</Text>
        </TouchableOpacity>
      </View>

      {/* Inventory Warnings Banner */}
      {alerts.length > 0 ? (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>⚠️ Inventory Reorder & Expiry Alerts ({alerts.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {alerts.map(a => (
              <View key={a.id} style={styles.alertChip}>
                <Text style={styles.alertChipText}>
                  {a.medicineName} ({a.stockQuantity <= a.reorderLevel ? `Low Stock: ${a.stockQuantity}` : `Exp: ${a.expiryDate}`})
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search medicines by name or brand..."
        placeholderTextColor="#94A3B8"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catTab, selectedCategory === cat && styles.catTabActive]}
            onPress={() => setSelectedCategory(cat)}>
            <Text style={[styles.catTabText, selectedCategory === cat && styles.catTabTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Medicine Stock List */}
      <Text style={styles.sectionTitle}>Stock Inventory ({medicines.length})</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
      ) : medicines.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No medicines found matching selected filter.</Text>
        </View>
      ) : (
        medicines.map(m => (
          <View key={m.id} style={styles.medCard}>
            <View style={styles.medHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{m.medicineName}</Text>
                {m.genericName ? <Text style={styles.medGeneric}>Generic: {m.genericName}</Text> : null}
              </View>
              <Text style={styles.medPrice}>${m.unitPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.medDetailsRow}>
              <Text style={styles.medTag}>Category: {m.category}</Text>
              <Text style={styles.medTag}>Batch: {m.batchNumber}</Text>
              <Text style={styles.medTag}>Exp: {m.expiryDate}</Text>
            </View>

            <View style={styles.stockStatusRow}>
              <Text style={styles.stockQtyText}>
                In Stock: <Text style={{ color: m.isLowStock ? '#DC2626' : '#16A34A', fontWeight: 'bold' }}>{m.stockQuantity} units</Text>
              </Text>

              {m.isLowStock ? (
                <View style={styles.badgeWarn}>
                  <Text style={styles.badgeWarnText}>LOW STOCK</Text>
                </View>
              ) : null}

              {m.isExpiringSoon ? (
                <View style={styles.badgeExp}>
                  <Text style={styles.badgeExpText}>EXPIRING SOON</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.dispenseBtn}
              onPress={() => handleOpenDispenseModal(m)}>
              <Text style={styles.dispenseBtnText}>🛒 Dispense Medicine (POS)</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Add / Restock Medicine Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add / Restock Medicine Inventory</Text>

            <Text style={styles.inputLabel}>Medicine Name</Text>
            <TextInput style={styles.textInput} value={medName} onChangeText={setMedName} placeholder="e.g. Paracetamol 500mg" />

            <Text style={styles.inputLabel}>Generic Formula Name</Text>
            <TextInput style={styles.textInput} value={genericName} onChangeText={setGenericName} placeholder="e.g. Acetaminophen" />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput style={styles.textInput} value={category} onChangeText={setCategory} />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Batch Number</Text>
                <TextInput style={styles.textInput} value={batchNo} onChangeText={setBatchNo} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Stock Quantity</Text>
                <TextInput style={styles.textInput} value={stockQty} onChangeText={setStockQty} keyboardType="number-pad" />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Unit Price ($)</Text>
                <TextInput style={styles.textInput} value={unitPrice} onChangeText={setUnitPrice} keyboardType="decimal-pad" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Expiry Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.textInput} value={expiryDate} onChangeText={setExpiryDate} />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Manufacturer</Text>
                <TextInput style={styles.textInput} value={manufacturer} onChangeText={setManufacturer} />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, submittingMed && styles.btnDisabled]}
                onPress={handleAddMedicine}
                disabled={submittingMed}>
                {submittingMed ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Save to Inventory</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispense Medicine POS Modal */}
      <Modal visible={dispenseModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dispense {selectedMedForDispense?.medicineName}</Text>
            <Text style={styles.modalSub}>Unit Price: ${selectedMedForDispense?.unitPrice?.toFixed(2)} | In Stock: {selectedMedForDispense?.stockQuantity}</Text>

            <Text style={styles.inputLabel}>Patient ID (UUID)</Text>
            <TextInput style={styles.textInput} value={patientId} onChangeText={setPatientId} />

            <Text style={styles.inputLabel}>Quantity to Dispense</Text>
            <TextInput style={styles.textInput} value={dispenseQty} onChangeText={setDispenseQty} keyboardType="number-pad" />

            <View style={styles.totalPreviewBox}>
              <Text style={styles.totalPreviewLabel}>Total Payable Amount:</Text>
              <Text style={styles.totalPreviewVal}>
                ${((selectedMedForDispense?.unitPrice || 0) * (parseInt(dispenseQty, 10) || 0)).toFixed(2)}
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDispenseModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#16A34A' }, submittingDispense && styles.btnDisabled]}
                onPress={handleConfirmDispense}
                disabled={submittingDispense}>
                {submittingDispense ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Dispense & Issue Bill</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addMedBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addMedBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  alertBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B45309',
  },
  alertChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  catScroll: {
    marginBottom: 16,
  },
  catTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  catTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  catTabTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 1,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  medGeneric: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  medPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  medDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  medTag: {
    fontSize: 12,
    color: '#475569',
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  stockQtyText: {
    fontSize: 13,
    color: '#334155',
  },
  badgeWarn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeWarnText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeExp: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeExpText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dispenseBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  dispenseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  totalPreviewBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  totalPreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  totalPreviewVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default PharmacyScreen;
