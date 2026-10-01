import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface MedicineItem {
  medicineName: string;
  dosage: string;
  instructions: string;
}

const CreatePrescriptionScreen = ({ route, navigation }: any) => {
  const { appointmentId, patientName } = route.params || {};

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<MedicineItem[]>([
    { medicineName: 'Amoxicillin 500mg', dosage: '1 tablet 3x daily', instructions: 'After meals' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addMedicine = () => {
    setItems([...items, { medicineName: '', dosage: '', instructions: '' }]);
  };

  const removeMedicine = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateMedicine = (index: number, field: keyof MedicineItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Required', 'Please enter a diagnosis.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/prescriptions', {
        appointmentId,
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        items: items.filter((i) => i.medicineName.trim().length > 0),
      });

      Alert.alert('Success', 'Digital Prescription & Invoice generated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to create prescription:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Issue Digital Prescription</Text>
      <Text style={styles.patientSub}>Patient: {patientName || 'Selected Patient'}</Text>

      {/* Diagnosis */}
      <Text style={styles.label}>1. Diagnosis / Clinical Findings *</Text>
      <TextInput
        style={styles.textInput}
        value={diagnosis}
        onChangeText={setDiagnosis}
        placeholder="e.g. Acute Bacterial Sinusitis, Hypertension"
      />

      {/* Prescribed Medications */}
      <View style={styles.medHeader}>
        <Text style={styles.label}>2. Prescribed Medications</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addMedicine}>
          <Text style={styles.addBtnText}>+ Add Medicine</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.medCard}>
          <View style={styles.medCardHeader}>
            <Text style={styles.medCardTitle}>Medicine #{index + 1}</Text>
            {items.length > 1 ? (
              <TouchableOpacity onPress={() => removeMedicine(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <TextInput
            style={styles.medInput}
            value={item.medicineName}
            onChangeText={(val) => updateMedicine(index, 'medicineName', val)}
            placeholder="Medicine Name (e.g. Paracetamol 500mg)"
          />
          <TextInput
            style={styles.medInput}
            value={item.dosage}
            onChangeText={(val) => updateMedicine(index, 'dosage', val)}
            placeholder="Dosage & Frequency (e.g. 1 tab twice daily)"
          />
          <TextInput
            style={styles.medInput}
            value={item.instructions}
            onChangeText={(val) => updateMedicine(index, 'instructions', val)}
            placeholder="Instructions (e.g. Take after food for 5 days)"
          />
        </View>
      ))}

      {/* Doctor Advice / Notes */}
      <Text style={styles.label}>3. Additional Advice / Dietary Notes</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Drink plenty of water, avoid cold beverages..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Finalize & Issue Prescription</Text>
        )}
      </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  patientSub: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 13,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  removeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  medInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  btnDisabled: {
    backgroundColor: '#86EFAC',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreatePrescriptionScreen;
