import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  doctorSpecialization: string;
  scheduledTime: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes: string;
}

const MyAppointmentsScreen = () => {
  const { user } = useAuthStore();
  const isDoctor = user?.roles?.includes('ROLE_DOCTOR');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get('/appointments/my');
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/appointments/${id}/status`, { status: newStatus });
      Alert.alert('Updated', `Appointment marked as ${newStatus}.`);
      fetchAppointments();
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const renderBadge = (status: string) => {
    let bg = '#FEF3C7';
    let text = '#854D0E';

    if (status === 'CONFIRMED') {
      bg = '#DCFCE7';
      text = '#166534';
    } else if (status === 'CANCELLED') {
      bg = '#FEE2E2';
      text = '#991B1B';
    } else if (status === 'COMPLETED') {
      bg = '#E0F2FE';
      text = '#075985';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.titleText}>
          {isDoctor ? item.patientName : item.doctorName}
        </Text>
        {renderBadge(item.status)}
      </View>

      <Text style={styles.subtitleText}>
        {isDoctor ? 'Patient' : item.doctorSpecialization}
      </Text>

      <Text style={styles.timeText}>
        🕒 {new Date(item.scheduledTime).toLocaleString()}
      </Text>

      {item.notes ? <Text style={styles.notesText}>Notes: {item.notes}</Text> : null}

      {/* Action Buttons for Doctors */}
      {isDoctor && item.status === 'REQUESTED' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleUpdateStatus(item.id, 'CONFIRMED')}>
            <Text style={styles.btnText}>Accept Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => handleUpdateStatus(item.id, 'CANCELLED')}>
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>
        {isDoctor ? 'Patient Appointments' : 'My Scheduled Consultations'}
      </Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No appointments found.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginTop: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    marginTop: 6,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 0.48,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#16A34A',
  },
  declineBtn: {
    backgroundColor: '#DC2626',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },
});

export default MyAppointmentsScreen;
