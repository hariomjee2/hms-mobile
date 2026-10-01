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
} from 'react-native';
import apiClient from '../../api/apiClient';

interface QueueItem {
  id: string;
  patientName: string;
  tokenNumber: number;
  queueStatus: 'WAITING' | 'IN_CABIN' | 'COMPLETED';
  notes: string;
}

const DoctorQueueScreen = ({ navigation }: any) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQueue();
    });
    fetchQueue();
    return unsubscribe;
  }, [navigation]);

  const fetchQueue = async () => {
    try {
      const response = await apiClient.get('/queue/doctor-live');
      setQueue(response.data);
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
        Alert.alert('Queue Complete', 'There are no waiting patients left in queue.');
      } else {
        Alert.alert('Calling Patient', `Calling Token #${response.data.tokenNumber} (${response.data.patientName}) into cabin.`);
      }
      fetchQueue();
    } catch (error) {
      console.error('Call next error:', error);
      Alert.alert('Error', 'Unable to call next patient.');
    } finally {
      setCalling(false);
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
      <Text style={styles.headerTitle}>Live Consultation Cabin</Text>
      <Text style={styles.subTitle}>Manage patient queue and consultations in real-time</Text>

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[styles.callNextBtn, calling && styles.btnDisabled]}
        onPress={handleCallNext}
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
            style={styles.labBtn}
            onPress={() =>
              navigation.navigate('AssignLabTest', {
                appointmentId: currentPatient.id,
                patientName: currentPatient.patientName,
              })
            }>
            <Text style={styles.btnTextText}>🔬 Assign Diagnostic Lab Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rxBtn}
            onPress={() =>
              navigation.navigate('CreatePrescription', {
                appointmentId: currentPatient.id,
                patientName: currentPatient.patientName,
              })
            }>
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
  labBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
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
});

export default DoctorQueueScreen;
