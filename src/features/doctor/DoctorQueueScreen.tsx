import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import apiClient from '../../api/apiClient';
import ToastBanner from '../../components/ToastBanner';

interface QueueItem {
  id: string;
  patientName: string;
  tokenNumber: number;
  queueStatus: 'WAITING' | 'IN_CABIN' | 'COMPLETED';
  notes: string;
}

const WARD_OPTIONS = [
  { label: 'Intensive Care Unit (ICU)', value: 'ICU' },
  { label: 'General Medical Ward', value: 'GENERAL' },
  { label: 'Private Deluxe Suite', value: 'PRIVATE' },
];

const DoctorQueueScreen = ({ navigation }: any) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // IPD Referral Modal State
  const [ipdModalVisible, setIpdModalVisible] = useState(false);
  const [selectedWardType, setSelectedWardType] = useState('GENERAL');
  const [referralNotes, setReferralNotes] = useState('Patient requires in-patient observation.');
  const [submittingReferral, setSubmittingReferral] = useState(false);

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQueue();
    });
    fetchQueue();
    return unsubscribe;
  }, [navigation]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const fetchQueue = async () => {
    try {
      const response = await apiClient.get('/queue/doctor-live');
      setQueue(response.data || []);
    } catch (error) {
      console.error('Failed to load doctor queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const response = await apiClient.post('/queue/call-next');
      if (response.status === 204 || !response.data) {
        showToast('There are no waiting patients left in queue.', 'info');
      } else {
        showToast(`Calling Token #${response.data.tokenNumber} (${response.data.patientName}) into cabin!`, 'success');
      }
      fetchQueue();
    } catch (error) {
      console.error('Call next error:', error);
      showToast('Unable to call next patient.', 'error');
    } finally {
      setCalling(false);
    }
  };

  const handleConfirmIpdReferral = async (appointmentId: string) => {
    setSubmittingReferral(true);
    try {
      await apiClient.post(`/appointments/${appointmentId}/refer-ipd`, {
        wardType: selectedWardType,
        notes: referralNotes.trim(),
      });

      showToast('Hospitalization Referral Submitted to IPD Desk!', 'success');
      setIpdModalVisible(false);
      fetchQueue();
    } catch (error: any) {
      console.error('Referral failed:', error);
      showToast(error?.response?.data?.message || 'Could not submit referral.', 'error');
    } finally {
      setSubmittingReferral(false);
    }
  };

  const currentPatient = queue.find((q) => q.queueStatus === 'IN_CABIN');
  const waitingPatients = queue.filter((q) => q.queueStatus === 'WAITING');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue(); }} />
      }>
      <ToastBanner visible={toastVisible} message={toastMessage} type={toastType} onClose={() => setToastVisible(false)} />

      <Text style={styles.headerTitle}>Live Consultation Cabin</Text>
      <Text style={styles.subTitle}>Manage patient queue and consultations in real-time</Text>

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[styles.callNextBtn, calling && styles.btnDisabled]}
        onPress={handleCallNext}
        activeOpacity={0.7}
        disabled={calling}>
        {calling ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.callNextText}>
            📢 Call Next Patient ({waitingPatients.length} Waiting)
          </Text>
        )}
      </TouchableOpacity>

      {/* Currently In Cabin Patient */}
      <Text style={styles.sectionTitle}>Currently in Cabin</Text>
      {currentPatient ? (
        <View style={styles.cabinCard}>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenBadgeText}>TOKEN #{currentPatient.tokenNumber}</Text>
          </View>
          <Text style={styles.patientName}>{currentPatient.patientName}</Text>
          <Text style={styles.statusText}>STATUS: IN CONSULTATION</Text>
          {currentPatient.notes ? (
            <Text style={styles.notesText}>Symptoms/Notes: {currentPatient.notes}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.ipdBtn}
            onPress={() => setIpdModalVisible(true)}
            activeOpacity={0.7}>
            <Text style={styles.btnTextText}>🚨 Refer for IPD Hospitalization</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.labBtn}
            onPress={() =>
              navigation.navigate('AssignLabTest', {
                appointmentId: currentPatient.id,
                patientName: currentPatient.patientName,
              })
            }
            activeOpacity={0.7}>
            <Text style={styles.btnTextText}>🔬 Assign Diagnostic Lab Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rxBtn}
            onPress={() =>
              navigation.navigate('CreatePrescription', {
                appointmentId: currentPatient.id,
                patientName: currentPatient.patientName,
              })
            }
            activeOpacity={0.7}>
            <Text style={styles.btnTextText}>💊 Issue Digital Prescription & Bill</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Cabin is currently empty.</Text>
        </View>
      )}

      {/* Waiting List */}
      <Text style={styles.sectionTitle}>Waiting List ({waitingPatients.length})</Text>
      {waitingPatients.length > 0 ? (
        waitingPatients.map((item) => (
          <View key={item.id} style={styles.waitingCard}>
            <View style={styles.tokenCircle}>
              <Text style={styles.tokenNumber}>#{item.tokenNumber}</Text>
            </View>
            <View style={styles.waitingInfo}>
              <Text style={styles.waitingName}>{item.patientName}</Text>
              <Text style={styles.waitingStatus}>Status: Waiting in lobby</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noWaitingText}>No patients waiting right now.</Text>
      )}

      {/* IPD Referral Modal */}
      {currentPatient ? (
        <Modal visible={ipdModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Refer {currentPatient.patientName} for IPD</Text>
              <Text style={styles.modalSub}>Send admission referral to IPD Desk & Ward Management</Text>

              <Text style={styles.inputLabel}>Recommended Ward Type</Text>
              <View style={styles.wardTypeRow}>
                {WARD_OPTIONS.map((w) => (
                  <TouchableOpacity
                    key={w.value}
                    style={[styles.wardChip, selectedWardType === w.value && styles.wardChipActive]}
                    onPress={() => setSelectedWardType(w.value)}>
                    <Text style={[styles.wardChipText, selectedWardType === w.value && styles.wardChipTextActive]}>
                      {w.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Clinical Referral Notes</Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                multiline
                value={referralNotes}
                onChangeText={setReferralNotes}
                placeholder="Reason for hospitalization, clinical observation required..."
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIpdModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, submittingReferral && styles.btnDisabled]}
                  onPress={() => handleConfirmIpdReferral(currentPatient.id)}
                  disabled={submittingReferral}>
                  {submittingReferral ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Submit Referral</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
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
    maxWidth: 750,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  callNextBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#86EFAC',
  },
  callNextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  cabinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: '#16A34A',
    marginBottom: 24,
    elevation: 2,
  },
  tokenBadge: {
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  tokenBadgeText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 12,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#16A34A',
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#334155',
    marginTop: 8,
    fontStyle: 'italic',
  },
  ipdBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  labBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  rxBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnTextText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  tokenCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenNumber: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 15,
  },
  waitingInfo: {
    flex: 1,
  },
  waitingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  waitingStatus: {
    fontSize: 12,
    color: '#64748B',
  },
  noWaitingText: {
    color: '#94A3B8',
    fontStyle: 'italic',
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
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  wardTypeRow: {
    gap: 8,
    marginBottom: 12,
  },
  wardChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  wardChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  wardChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  wardChipTextActive: {
    color: '#DC2626',
    fontWeight: 'bold',
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
    backgroundColor: '#DC2626',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DoctorQueueScreen;
