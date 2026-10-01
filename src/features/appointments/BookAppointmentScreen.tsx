import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  consultationFee: number;
}

const BookAppointmentScreen = ({ navigation }: any) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('2026-10-01T10:00:00Z');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/doctors');
      setDoctors(response.data);
      if (response.data.length > 0) {
        setSelectedDoctor(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
      Alert.alert('Error', 'Unable to fetch doctors list.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor) {
      Alert.alert('Selection Required', 'Please select a doctor.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/appointments', {
        doctorId: selectedDoctor.id,
        scheduledTime: selectedDate,
        notes: notes.trim(),
      });

      Alert.alert('Success', 'Your appointment request has been submitted!', [
        {
          text: 'View Appointments',
          onPress: () => navigation.navigate('MyAppointments'),
        },
      ]);
    } catch (error: any) {
      console.error('Booking failed:', error);
      Alert.alert('Booking Failed', error?.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading available doctors...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Book an Appointment</Text>
      <Text style={styles.subTitle}>Select a specialist and preferred time</Text>

      {/* Doctor Selection */}
      <Text style={styles.sectionTitle}>1. Choose a Specialist</Text>
      {doctors.map((doc) => {
        const isSelected = selectedDoctor?.id === doc.id;
        return (
          <TouchableOpacity
            key={doc.id}
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
              <Text style={styles.doctorFee}>Consultation Fee: ${doc.consultationFee}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Date & Time Selection */}
      <Text style={styles.sectionTitle}>2. Scheduled Date & Time</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>ISO Date/Time (e.g., 2026-10-01T10:30:00Z)</Text>
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
