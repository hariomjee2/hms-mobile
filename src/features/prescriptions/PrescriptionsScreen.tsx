import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface MedicineItem {
  id: string;
  medicineName: string;
  dosage: string;
  instructions: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  doctorSpecialization: string;
  diagnosis: string;
  notes: string;
  createdAt: string;
  items: MedicineItem[];
}

const PrescriptionsScreen = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await apiClient.get('/prescriptions/my');
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderPrescriptionCard = ({ item }: { item: Prescription }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.doctorName}>{item.doctorName}</Text>
          <Text style={styles.specialty}>{item.doctorSpecialization}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.diagnosisBox}>
        <Text style={styles.diagnosisLabel}>DIAGNOSIS</Text>
        <Text style={styles.diagnosisVal}>{item.diagnosis}</Text>
      </View>

      <Text style={styles.sectionLabel}>Prescribed Medicines:</Text>
      {item.items.map((med, index) => (
        <View key={med.id || index} style={styles.medRow}>
          <Text style={styles.bullet}>💊</Text>
          <View style={styles.medDetails}>
            <Text style={styles.medName}>{med.medicineName}</Text>
            <Text style={styles.medDosage}>{med.dosage}</Text>
            {med.instructions ? (
              <Text style={styles.medInst}>{med.instructions}</Text>
            ) : null}
          </View>
        </View>
      ))}

      {item.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>Doctor Advice: {item.notes}</Text>
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
      <Text style={styles.headerTitle}>My Digital Prescriptions</Text>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderPrescriptionCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPrescriptions(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No digital prescriptions found.</Text>
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
  headerTitle: {
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
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  specialty: {
    fontSize: 13,
    color: '#64748B',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  diagnosisBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  diagnosisLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  diagnosisVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  bullet: {
    marginRight: 8,
    fontSize: 14,
  },
  medDetails: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  medDosage: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  medInst: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  notesBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
  },
});

export default PrescriptionsScreen;
