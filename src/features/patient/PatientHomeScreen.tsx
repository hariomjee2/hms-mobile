import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';
import AvatarPicker from '../../components/AvatarPicker';

const PatientHomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [latestAppointment, setLatestAppointment] = useState<any>(null);
  const [queueData, setQueueData] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    fetchData();
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const apptRes = await apiClient.get('/appointments/my');
      if (apptRes.data && apptRes.data.length > 0) {
        setLatestAppointment(apptRes.data[0]);
      }

      const queueRes = await apiClient.get('/queue/my-token');
      if (queueRes.data && queueRes.data.hasCheckIn) {
        setQueueData(queueRes.data);
      } else {
        setQueueData(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckIn = async () => {
    if (!latestAppointment) return;
    setCheckingIn(true);
    try {
      const response = await apiClient.post(`/queue/check-in/${latestAppointment.id}`);
      Alert.alert('Checked In!', `You have been assigned Token #${response.data.tokenNumber}.`);
      fetchData();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Check-In Failed', 'Unable to process check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.userHeaderLeft}>
          <AvatarPicker userId={user?.id} email={user?.email} size={50} />
          <View style={styles.userInfo}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email || 'Patient'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Live Queue Banner if Checked-In */}
      {queueData ? (
        <View style={styles.liveQueueCard}>
          <Text style={styles.liveQueueTitle}>🏥 Live OPD Queue Status</Text>
          <Text style={styles.doctorNameText}>{queueData.doctorName}</Text>
          <View style={styles.tokenRow}>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>YOUR TOKEN</Text>
              <Text style={styles.tokenVal}>#{queueData.myTokenNumber}</Text>
            </View>

            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>CURRENTLY SERVING</Text>
              <Text style={[styles.tokenVal, { color: '#16A34A' }]}>
                {queueData.currentServingTokenNumber > 0 ? `#${queueData.currentServingTokenNumber}` : 'Waiting...'}
              </Text>
            </View>
          </View>
          <Text style={styles.queueStatusBadge}>
            STATUS: {queueData.queueStatus === 'IN_CABIN' ? '🚨 PLEASE ENTER CABIN NOW' : 'WAITING IN LOBBY'}
          </Text>
        </View>
      ) : null}

      {/* Health Profile */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>My Health Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PatientDocuments')}>
            <Text style={styles.docLinkText}>📂 Medical Documents →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileRow}>
          <View style={styles.profileBadge}>
            <Text style={styles.badgeLabel}>Blood Group</Text>
            <Text style={styles.badgeValue}>O+</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.badgeLabel}>Emergency Contact</Text>
            <Text style={styles.badgeValue}>555-0199</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate('BookAppointment')}>
          <Text style={styles.gridIcon}>📅</Text>
          <Text style={styles.gridText}>Book Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate('MyAppointments')}>
          <Text style={styles.gridIcon}>📋</Text>
          <Text style={styles.gridText}>My Consultations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate('Prescriptions')}>
          <Text style={styles.gridIcon}>💊</Text>
          <Text style={styles.gridText}>Prescriptions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate('Billing')}>
          <Text style={styles.gridIcon}>💳</Text>
          <Text style={styles.gridText}>Billing & Claims</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments & Check-In */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Appointment</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyAppointments')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {latestAppointment ? (
        <View style={[styles.card, styles.appointmentCard]}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.doctorName}>{latestAppointment.doctorName}</Text>
            <Text style={styles.statusBadge}>{latestAppointment.status}</Text>
          </View>
          <Text style={styles.specialty}>{latestAppointment.doctorSpecialization}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              🕒 {new Date(latestAppointment.scheduledTime).toLocaleString()}
            </Text>
          </View>

          {/* Check-In Button if not checked in */}
          {!latestAppointment.tokenNumber && latestAppointment.status !== 'CANCELLED' ? (
            <TouchableOpacity
              style={styles.checkInBtn}
              onPress={handleCheckIn}
              disabled={checkingIn}>
              {checkingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.checkInBtnText}>Check-In Upon Arrival (Get Queue Token)</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.noApptText}>No upcoming appointments scheduled.</Text>
        </View>
      )}
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
  liveQueueCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  liveQueueTitle: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  doctorNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tokenBox: {
    backgroundColor: '#312E81',
    borderRadius: 8,
    padding: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  tokenLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tokenVal: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  queueStatusBadge: {
    color: '#FACC15',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  docLinkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    flex: 0.48,
  },
  badgeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  seeAllText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8,
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  gridIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  appointmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  specialty: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  timeRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  checkInBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  noApptText: {
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default PatientHomeScreen;
