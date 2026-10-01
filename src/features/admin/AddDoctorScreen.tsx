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

const AddDoctorScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialization, setSpecialization] = useState('Pediatrician');
  const [department, setDepartment] = useState('Pediatrics');
  const [consultationFee, setConsultationFee] = useState('120.00');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please fill in email, first name, and last name.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/admin/doctors', {
        email: email.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        specialization: specialization.trim(),
        department: department.trim(),
        consultationFee: parseFloat(consultationFee) || 100.0,
      });

      Alert.alert('Doctor Onboarded!', `Dr. ${firstName} ${lastName} has been added to staff.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Failed to register doctor:', error);
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Failed to onboard doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Onboard New Doctor</Text>
      <Text style={styles.subTitle}>Register a medical specialist to hospital staff</Text>

      {/* Account Info */}
      <Text style={styles.sectionLabel}>Account Credentials</Text>
      <TextInput
        style={styles.textInput}
        value={email}
        onChangeText={setEmail}
        placeholder="Doctor Email (e.g. dr.robert@hms.com)"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.textInput}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      {/* Personal Info */}
      <Text style={styles.sectionLabel}>Personal Details</Text>
      <TextInput
        style={styles.textInput}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name (e.g. Robert)"
      />
      <TextInput
        style={styles.textInput}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name (e.g. Chen)"
      />

      {/* Specialty & Department */}
      <Text style={styles.sectionLabel}>Clinical Specialization</Text>
      <TextInput
        style={styles.textInput}
        value={specialization}
        onChangeText={setSpecialization}
        placeholder="Specialization (e.g. Neurologist)"
      />
      <TextInput
        style={styles.textInput}
        value={department}
        onChangeText={setDepartment}
        placeholder="Department (e.g. Neurology)"
      />
      <TextInput
        style={styles.textInput}
        value={consultationFee}
        onChangeText={setConsultationFee}
        placeholder="Consultation Fee ($)"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={handleRegister}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>Complete Onboarding</Text>
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
  subTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
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
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
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

export default AddDoctorScreen;
