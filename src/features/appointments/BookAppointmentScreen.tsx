import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/apiClient';
import ToastBanner from '../../components/ToastBanner';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  consultationFee: number;
}

const BookAppointmentScreen = ({ navigation }: any) => {
  const scrollRef = useRef<ScrollView>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Default to tomorrow at 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(tomorrow.toISOString());
  const [notes, setNotes] = useState('Routine health checkup & consultation.');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Toast Notification State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/doctors');
      setDoctors(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedDoctor(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
      showToast('Unable to fetch doctors list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor) {
      showToast('Please select a doctor.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/appointments', {
        doctorId: selectedDoctor.id,
        scheduledTime: selectedDate,
        notes: notes.trim(),
      });

      showToast(`Appointment with Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} confirmed!`, 'success');
      setTimeout(() => {
        navigation.navigate('MyAppointments');
      }, 1500);
    } catch (error: any) {
      console.error('Booking failed:', error);
      showToast(error?.response?.data?.message || 'Could not process booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDateSelect = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(10, 0, 0, 0);
    setSelectedDate(d.toISOString());
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading available specialists...</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      <ToastBanner
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />

      <Text style={styles.headerTitle}>Book an Appointment</Text>
      <Text style={styles.subTitle}>Select a specialist doctor and preferred consultation slot</Text>

      {/* Doctor Selection */}
      <Text style={styles.sectionTitle}>1. Select Hospital Specialist ({doctors.length} Available)</Text>
      {doctors.map((doc) => {
        const isSelected = selectedDoctor?.id === doc.id;
        return (
          <TouchableOpacity
            key={doc.id}
            activeOpacity={0.7}
            style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
            onPress={() => setSelectedDoctor(doc)}>
            <View style={styles.radioContainer}>
              <View style={[styles.radio, isSelected && styles.radioSelected]} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                Dr. {doc.firstName} {doc.lastName}
              </Text>
              <Text style={styles.doctorSpecialty}>
                {doc.specialization} • {doc.department}
              </Text>
              <Text style={styles.doctorFee}>Consultation Fee: ${doc.consultationFee?.toFixed(2) || '150.00'}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Date & Time Selection */}
      <Text style={styles.sectionTitle}>2. Scheduled Date & Slot</Text>
      <View style={styles.quickDateRow}>
        <TouchableOpacity style={styles.dateChip} onPress={() => handleQuickDateSelect(1)}>
          <Text style={styles.dateChipText}>Tomorrow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateChip} onPress={() => handleQuickDateSelect(2)}>
          <Text style={styles.dateChipText}>In 2 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateChip} onPress={() => handleQuickDateSelect(3)}>
          <Text style={styles.dateChipText}>In 3 Days</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>ISO Date & Time Timestamp</Text>
        <TextInput
          style={styles.textInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DDTHH:MM:SSZ"
        />
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>3. Reason for Visit / Symptoms</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Describe symptoms or primary reason for consultation..."
        multiline
        numberOfLines={3}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={handleBook}
        activeOpacity={0.7}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Confirm Booking Request</Text>
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
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
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
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 10,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  doctorCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioContainer: {
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  radioSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  doctorFee: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 4,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateChipText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
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
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookAppointmentScreen;
