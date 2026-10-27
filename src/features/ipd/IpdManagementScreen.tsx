import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';

interface Ward {
  id: string;
  wardName: string;
  wardType: string;
  dailyRate: number;
  totalBeds: number;
  availableBedsCount: number;
  occupiedBedsCount: number;
}

interface Bed {
  id: string;
  wardId: string;
  wardName: string;
  wardType: string;
  dailyRate: number;
  bedNumber: string;
  status: string;
}

interface Admission {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  bedId: string;
  bedNumber: string;
  wardName: string;
  dailyRate: number;
  admissionDate: string;
  dischargeDate?: string;
  admissionNotes?: string;
  dischargeSummary?: string;
  status: string;
  totalBillAmount?: number;
  invoiceId?: string;
}

const IpdManagementScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isPatient = roles.includes('ROLE_PATIENT') && !roles.includes('ROLE_DOCTOR') && !roles.includes('ROLE_ADMIN');

  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [myAdmission, setMyAdmission] = useState<Admission | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Admission Modal State
  const [admitModalVisible, setAdmitModalVisible] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [patientIdInput, setPatientIdInput] = useState('11111111-1111-1111-1111-111111111111'); // Demo Patient UUID
  const [doctorIdInput, setDoctorIdInput] = useState('22222222-2222-2222-2222-222222222222'); // Demo Doctor UUID
  const [admissionNotes, setAdmissionNotes] = useState('Patient requires ICU cardiac observation.');
  const [submittingAdmit, setSubmittingAdmit] = useState(false);

  // Discharge Modal State
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState('Patient recovered in stable condition.');
  const [submittingDischarge, setSubmittingDischarge] = useState(false);

  useEffect(() => {
    loadIpdData();
  }, []);

  const loadIpdData = async () => {
    setLoading(true);
    try {
      if (isPatient) {
        const [wardsRes, myRes] = await Promise.all([
          apiClient.get('/ipd/wards'),
          apiClient.get('/ipd/admissions/my'),
        ]);
        setWards(wardsRes.data || []);
        setMyAdmission(myRes.data || null);
      } else {
        const [wardsRes, bedsRes, admissionsRes] = await Promise.all([
          apiClient.get('/ipd/wards'),
          apiClient.get('/ipd/beds'),
          apiClient.get('/ipd/admissions?status=ADMITTED'),
        ]);
        setWards(wardsRes.data || []);
        setBeds(bedsRes.data || []);
        setAdmissions(admissionsRes.data || []);
      }
    } catch (error) {
      console.error('Failed to load IPD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdmitModal = (bed: Bed) => {
    if (isPatient) return; // Patients cannot trigger admission
    if (bed.status !== 'AVAILABLE') {
      Alert.alert('Bed Occupied', `Bed ${bed.bedNumber} is currently occupied.`);
      return;
    }
    setSelectedBed(bed);
    setAdmitModalVisible(true);
  };

  const handleConfirmAdmission = async () => {
    if (!selectedBed || !patientIdInput || !doctorIdInput) {
      Alert.alert('Missing Details', 'Please fill in Patient ID and Doctor ID.');
      return;
    }

    setSubmittingAdmit(true);
    try {
      await apiClient.post('/ipd/admissions', {
        patientId: patientIdInput.trim(),
        doctorId: doctorIdInput.trim(),
        bedId: selectedBed.id,
        admissionNotes: admissionNotes.trim(),
      });

      Alert.alert('🎉 Patient Admitted', `Successfully allocated Bed ${selectedBed.bedNumber}.`);
      setAdmitModalVisible(false);
      loadIpdData();
    } catch (error: any) {
      console.error('Admission error:', error);
      Alert.alert('Admission Error', error?.response?.data?.message || 'Could not admit patient.');
    } finally {
      setSubmittingAdmit(false);
    }
  };

  const handleOpenDischargeModal = (admission: Admission) => {
    setSelectedAdmission(admission);
    setDischargeModalVisible(true);
  };

  const handleConfirmDischarge = async () => {
    if (!selectedAdmission) return;

    setSubmittingDischarge(true);
    try {
      const res = await apiClient.post(`/ipd/admissions/${selectedAdmission.id}/discharge`, {
        dischargeSummary: dischargeSummary.trim(),
      });

      const dischargedData = res.data;
      setDischargeModalVisible(false);
      loadIpdData();

      Alert.alert(
        '🏥 Patient Discharged',
        `Discharge Summary Recorded.\nTotal Bill: $${dischargedData.totalBillAmount?.toFixed(2) || '0.00'}`,
        [
          {
            text: 'Pay Invoice Now',
            onPress: () => {
              if (dischargedData.invoiceId) {
                navigation.navigate('PaymentCheckout', {
                  invoiceId: dischargedData.invoiceId,
                  amount: dischargedData.totalBillAmount,
                  doctorName: dischargedData.doctorName,
                });
              }
            },
          },
          { text: 'Close' },
        ]
      );
    } catch (error: any) {
      console.error('Discharge error:', error);
      Alert.alert('Discharge Error', error?.response?.data?.message || 'Could not discharge patient.');
    } finally {
      setSubmittingDischarge(false);
    }
  };

  const filteredBeds = selectedWardId
    ? beds.filter(b => b.wardId === selectedWardId)
    : beds;

  // PATIENT ROLE VIEW
  if (isPatient) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>My In-Patient Stay (IPD)</Text>
        <Text style={styles.subTitle}>View your current active room admission and hospital ward details</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 30 }} />
        ) : myAdmission ? (
          <View style={styles.myStayCard}>
            <View style={styles.myStayHeader}>
              <Text style={styles.myStayTitle}>🏥 ACTIVE HOSPITAL ADMISSION</Text>
              <View style={styles.myStayBedTag}>
                <Text style={styles.myStayBedTagText}>Bed {myAdmission.bedNumber}</Text>
              </View>
            </View>

            <Text style={styles.myStayWardName}>{myAdmission.wardName}</Text>
            <Text style={styles.myStayRate}>Daily Rate: ${myAdmission.dailyRate?.toFixed(2)} / day</Text>

            <View style={styles.myStayDivider} />

            <Text style={styles.myStayDetail}>Attending Doctor: <Text style={styles.boldText}>{myAdmission.doctorName}</Text></Text>
            <Text style={styles.myStayDetail}>Admitted On: <Text style={styles.boldText}>{new Date(myAdmission.admissionDate).toLocaleString()}</Text></Text>

            {myAdmission.admissionNotes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Clinical Admission Notes:</Text>
                <Text style={styles.notesText}>{myAdmission.admissionNotes}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.noStayCard}>
            <Text style={styles.noStayIcon}>🛏️</Text>
            <Text style={styles.noStayTitle}>No Active In-Patient Admission</Text>
            <Text style={styles.noStaySub}>You are currently not admitted to any hospital ward or bed.</Text>
          </View>
        )}

        {/* Hospital Wards Overview for Patients */}
        <Text style={styles.sectionTitle}>Hospital Wards & Daily Rates</Text>
        {wards.map(w => (
          <View key={w.id} style={styles.patientWardCard}>
            <View style={styles.pWardHeader}>
              <Text style={styles.pWardName}>{w.wardName}</Text>
              <Text style={styles.pWardRate}>${w.dailyRate.toFixed(2)} / day</Text>
            </View>
            <Text style={styles.pWardType}>Type: {w.wardType}</Text>
            <Text style={styles.pWardAvailability}>
              Available Beds: <Text style={{ color: w.availableBedsCount > 0 ? '#16A34A' : '#DC2626', fontWeight: 'bold' }}>{w.availableBedsCount} of {w.totalBeds}</Text>
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  // DOCTOR / STAFF / ADMIN ROLE VIEW
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>In-Patient Department (IPD)</Text>
      <Text style={styles.subTitle}>Real-time ward occupancy, bed matrix, and admission management</Text>

      {/* Ward Cards Overview */}
      <Text style={styles.sectionTitle}>Hospital Wards Summary</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wardScroll}>
        <TouchableOpacity
          style={[styles.wardTab, selectedWardId === null && styles.wardTabActive]}
          onPress={() => setSelectedWardId(null)}>
          <Text style={[styles.wardTabText, selectedWardId === null && styles.wardTabTextActive]}>
            All Wards ({beds.length})
          </Text>
        </TouchableOpacity>

        {wards.map(w => (
          <TouchableOpacity
            key={w.id}
            style={[styles.wardCard, selectedWardId === w.id && styles.wardCardActive]}
            onPress={() => setSelectedWardId(selectedWardId === w.id ? null : w.id)}>
            <Text style={styles.wardCardTitle}>{w.wardName}</Text>
            <Text style={styles.wardCardRate}>${w.dailyRate.toFixed(2)} / day</Text>
            <View style={styles.wardBadgeRow}>
              <View style={styles.badgeAvail}>
                <Text style={styles.badgeText}>{w.availableBedsCount} Available</Text>
              </View>
              <View style={styles.badgeOcc}>
                <Text style={styles.badgeText}>{w.occupiedBedsCount} Occupied</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bed Matrix Grid */}
      <Text style={styles.sectionTitle}>Bed Status Matrix</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.bedGrid}>
          {filteredBeds.map(b => {
            const isAvail = b.status === 'AVAILABLE';
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.bedChip, isAvail ? styles.bedAvail : styles.bedOcc]}
                onPress={() => handleOpenAdmitModal(b)}>
                <Text style={styles.bedIcon}>{isAvail ? '🛏️' : '🏥'}</Text>
                <Text style={styles.bedNumber}>{b.bedNumber}</Text>
                <Text style={[styles.bedStatusText, isAvail ? styles.textAvail : styles.textOcc]}>
                  {b.status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Active Admissions List */}
      <Text style={styles.sectionTitle}>Currently Admitted Patients ({admissions.length})</Text>
      {admissions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active patient admissions currently in IPD.</Text>
        </View>
      ) : (
        admissions.map(a => (
          <View key={a.id} style={styles.admissionCard}>
            <View style={styles.admHeader}>
              <Text style={styles.admPatientName}>{a.patientName}</Text>
              <View style={styles.bedTag}>
                <Text style={styles.bedTagText}>{a.bedNumber} ({a.wardName})</Text>
              </View>
            </View>

            <Text style={styles.admDetail}>Doctor: {a.doctorName}</Text>
            <Text style={styles.admDetail}>Admitted: {new Date(a.admissionDate).toLocaleString()}</Text>

            {a.admissionNotes ? (
              <Text style={styles.admNotes}>Notes: {a.admissionNotes}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.dischargeBtn}
              onPress={() => handleOpenDischargeModal(a)}>
              <Text style={styles.dischargeBtnText}>📋 Discharge & Generate Bill</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Admit Patient Modal */}
      <Modal visible={admitModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admit Patient to Bed {selectedBed?.bedNumber}</Text>
            <Text style={styles.modalSub}>{selectedBed?.wardName} (${selectedBed?.dailyRate?.toFixed(2)}/day)</Text>

            <Text style={styles.inputLabel}>Patient ID (UUID)</Text>
            <TextInput
              style={styles.textInput}
              value={patientIdInput}
              onChangeText={setPatientIdInput}
            />

            <Text style={styles.inputLabel}>Attending Doctor ID (UUID)</Text>
            <TextInput
              style={styles.textInput}
              value={doctorIdInput}
              onChangeText={setDoctorIdInput}
            />

            <Text style={styles.inputLabel}>Admission Notes / Diagnosis</Text>
            <TextInput
              style={[styles.textInput, { height: 70 }]}
              multiline
              value={admissionNotes}
              onChangeText={setAdmissionNotes}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAdmitModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, submittingAdmit && styles.btnDisabled]}
                onPress={handleConfirmAdmission}
                disabled={submittingAdmit}>
                {submittingAdmit ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Admission</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Discharge Patient Modal */}
      <Modal visible={dischargeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Discharge {selectedAdmission?.patientName}</Text>
            <Text style={styles.modalSub}>Bed: {selectedAdmission?.bedNumber} ({selectedAdmission?.wardName})</Text>

            <Text style={styles.inputLabel}>Discharge Summary / Recovery Notes</Text>
            <TextInput
              style={[styles.textInput, { height: 90 }]}
              multiline
              value={dischargeSummary}
              onChangeText={setDischargeSummary}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDischargeModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#16A34A' }, submittingDischarge && styles.btnDisabled]}
                onPress={handleConfirmDischarge}
                disabled={submittingDischarge}>
                {submittingDischarge ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Finalize Discharge & Bill</Text>
                )}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 12,
  },
  wardScroll: {
    marginBottom: 16,
  },
  wardTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
  },
  wardTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  wardTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  wardTabTextActive: {
    color: '#FFFFFF',
  },
  wardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    width: 200,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    elevation: 1,
  },
  wardCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  wardCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  wardCardRate: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  wardBadgeRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  badgeAvail: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeOcc: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  bedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  bedChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    width: '30%',
    minWidth: 110,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  bedAvail: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  bedOcc: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  bedIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  bedNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  bedStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  textAvail: {
    color: '#16A34A',
  },
  textOcc: {
    color: '#DC2626',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  admissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 1,
  },
  admHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  admPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  bedTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bedTagText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  admDetail: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  admNotes: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 6,
  },
  dischargeBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  dischargeBtnText: {
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
    marginBottom: 12,
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
  // Patient specific styles
  myStayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  myStayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myStayTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  myStayBedTag: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  myStayBedTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  myStayWardName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  myStayRate: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  myStayDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  myStayDetail: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 4,
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notesBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  notesLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notesText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 2,
    fontStyle: 'italic',
  },
  noStayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noStayIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noStayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  noStaySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  patientWardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pWardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pWardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  pWardRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  pWardType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pWardAvailability: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
  },
});

export default IpdManagementScreen;
