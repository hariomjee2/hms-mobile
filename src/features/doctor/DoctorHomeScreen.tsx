import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';
import AvatarPicker from '../../components/AvatarPicker';

const DoctorHomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAppointments();
    });
    fetchAppointments();
    return unsubscribe;
  }, [navigation]);

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get('/appointments/my');
      const pending = response.data.filter((a: any) => a.status === 'REQUESTED');
      setPendingCount(pending.length);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.userHeaderLeft}>
          <AvatarPicker userId={user?.id} email={user?.email} size={50} />
          <View style={styles.userInfo}>
            <Text style={styles.greetingText}>Doctor Portal</Text>
            <Text style={styles.userName}>{user?.email || 'Dr. Jane Smith'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Availability Status Toggle */}
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>Duty Status</Text>
          <Text style={[styles.statusSubtitle, { color: isAvailable ? '#16A34A' : '#DC2626' }]}>
            {isAvailable ? 'Available for Consultations' : 'On Break / Busy'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
          thumbColor={isAvailable ? '#16A34A' : '#94A3B8'}
        />
      </View>

      {/* Quick Action to Manage Requests */}
      <TouchableOpacity
        style={styles.manageCard}
        onPress={() => navigation.navigate('MyAppointments')}>
        <View style={styles.manageHeader}>
          <Text style={styles.manageTitle}>Incoming Appointment Requests</Text>
          {pendingCount > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pendingCount} New</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.manageSubtitle}>Review, confirm, or cancel patient bookings →</Text>
      </TouchableOpacity>

      {/* Open Live Cabin Action */}
      <TouchableOpacity
        style={[styles.manageCard, { backgroundColor: '#16A34A' }]}
        onPress={() => navigation.navigate('DoctorQueue')}>
        <View style={styles.manageHeader}>
          <Text style={styles.manageTitle}>🏥 Open Consultation Cabin</Text>
        </View>
        <Text style={[styles.manageSubtitle, { color: '#DCFCE7' }]}>
          Call next patient, view current queue tokens & active patient →
        </Text>
      </TouchableOpacity>

      {/* Diagnostic Lab Orders Action */}
      <TouchableOpacity
        style={[styles.manageCard, { backgroundColor: '#0284C7' }]}
        onPress={() => navigation.navigate('PatientLabOrders')}>
        <View style={styles.manageHeader}>
          <Text style={styles.manageTitle}>🔬 Diagnostic Lab Orders</Text>
        </View>
        <Text style={[styles.manageSubtitle, { color: '#E0F2FE' }]}>
          View ordered lab tests, mark results, or skip tests →
        </Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  logoutBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statusSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  manageCard: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  manageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  manageSubtitle: {
    color: '#93C5FD',
    fontSize: 13,
    marginTop: 4,
  },
});

export default DoctorHomeScreen;
