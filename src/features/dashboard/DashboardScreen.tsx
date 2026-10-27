import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';
import ToastBanner from '../../components/ToastBanner';

interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}

interface PatientItem {
  id: string;
  firstName: string;
  lastName: string;
  bloodGroup: string;
  emergencyContact: string;
  email: string;
}

interface DoctorItem {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  consultationFee: number;
  email: string;
}

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Doctors & Patients Modal List State
  const [listModalVisible, setListModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'DOCTORS' | 'PATIENTS'>('DOCTORS');
  const [doctorsList, setDoctorsList] = useState<DoctorItem[]>([]);
  const [patientsList, setPatientsList] = useState<PatientItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Toast Notification State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStats();
    });
    fetchStats();
    return unsubscribe;
  }, [navigation]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      showToast('Could not refresh admin metrics.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenDoctorsList = async () => {
    setModalType('DOCTORS');
    setListModalVisible(true);
    setLoadingList(true);
    try {
      const response = await apiClient.get('/admin/doctors');
      setDoctorsList(response.data || []);
    } catch (err) {
      console.error('Failed to load doctors list:', err);
      showToast('Failed to fetch doctor roster.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const handleOpenPatientsList = async () => {
    setModalType('PATIENTS');
    setListModalVisible(true);
    setLoadingList(true);
    try {
      const response = await apiClient.get('/admin/patients');
      setPatientsList(response.data || []);
    } catch (err) {
      console.error('Failed to load patients list:', err);
      showToast('Failed to fetch patient records.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} />
      }>
      {/* Toast Banner */}
      <ToastBanner
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.greetingText}>Hospital Administrative Command Center</Text>
          <Text style={styles.userName}>{user?.email || 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()} activeOpacity={0.7}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Revenue Card */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>TOTAL REVENUE COLLECTED</Text>
        <Text style={styles.revenueValue}>
          ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
        </Text>
        <Text style={styles.revenueSub}>Aggregated from paid consultation & hospital stay invoices</Text>
      </View>

      {/* KPI Grid (Interactive Cards) */}
      <Text style={styles.sectionTitle}>Executive Metrics (Click Card to View Details)</Text>
      <View style={styles.kpiGrid}>
        <TouchableOpacity style={styles.kpiCard} onPress={handleOpenPatientsList} activeOpacity={0.7}>
          <Text style={styles.kpiIcon}>👥</Text>
          <Text style={styles.kpiNumber}>{stats?.totalPatients || 0}</Text>
          <Text style={styles.kpiLabel}>Registered Patients →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={handleOpenDoctorsList} activeOpacity={0.7}>
          <Text style={styles.kpiIcon}>👨‍⚕️</Text>
          <Text style={styles.kpiNumber}>{stats?.totalDoctors || 0}</Text>
          <Text style={styles.kpiLabel}>Active Doctors →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => navigation.navigate('IpdManagement')} activeOpacity={0.7}>
          <Text style={styles.kpiIcon}>🛏️</Text>
          <Text style={[styles.kpiNumber, { color: '#0284C7' }]}>IPD Wards</Text>
          <Text style={styles.kpiLabel}>Bed Allocation Matrix →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => navigation.navigate('Pharmacy')} activeOpacity={0.7}>
          <Text style={styles.kpiIcon}>💊</Text>
          <Text style={[styles.kpiNumber, { color: '#16A34A' }]}>Pharmacy</Text>
          <Text style={styles.kpiLabel}>Stock & POS →</Text>
        </TouchableOpacity>
      </View>

      {/* Administrative Operations */}
      <Text style={styles.sectionTitle}>Hospital Operations & Onboarding</Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('IpdManagement')}
          activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>🛏️ Manage Wards & Allot Beds</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
          onPress={() => navigation.navigate('AddDoctor')}
          activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>👨‍⚕️ + Onboard New Doctor</Text>
        </TouchableOpacity>
      </View>

      {/* Details List Modal */}
      <Modal visible={listModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {modalType === 'DOCTORS' ? '👨‍⚕️ Active Hospital Doctors' : '👥 Registered Patients Roster'}
              </Text>
              <TouchableOpacity onPress={() => setListModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingList ? (
              <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 30 }} />
            ) : modalType === 'DOCTORS' ? (
              doctorsList.length === 0 ? (
                <Text style={styles.emptyText}>No doctors onboarded yet.</Text>
              ) : (
                <ScrollView style={{ maxHeight: 400 }}>
                  {doctorsList.map(doc => (
                    <View key={doc.id} style={styles.itemCard}>
                      <Text style={styles.itemName}>Dr. {doc.firstName} {doc.lastName}</Text>
                      <Text style={styles.itemSub}>{doc.specialization} • {doc.department}</Text>
                      <Text style={styles.itemEmail}>Email: {doc.email}</Text>
                      <Text style={styles.itemFee}>Fee: ${doc.consultationFee?.toFixed(2)}</Text>
                    </View>
                  ))}
                </ScrollView>
              )
            ) : patientsList.length === 0 ? (
              <Text style={styles.emptyText}>No patients registered yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {patientsList.map(p => (
                  <View key={p.id} style={styles.itemCard}>
                    <Text style={styles.itemName}>{p.firstName} {p.lastName}</Text>
                    <Text style={styles.itemSub}>Blood Group: {p.bloodGroup || 'O+'} | Emergency: {p.emergencyContact || '555-0199'}</Text>
                    <Text style={styles.itemEmail}>Email: {p.email}</Text>
                    <Text style={styles.itemUuid}>ID: {p.id}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 13,
    color: '#64748B',
  },
  userName: {
    fontSize: 20,
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
  revenueCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
  },
  revenueLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  revenueValue: {
    color: '#38BDF8',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  revenueSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  kpiIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 4,
    textAlign: 'center',
  },
  btnRow: {
    gap: 10,
  },
  actionBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    maxWidth: 550,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 20,
  },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  itemSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  itemEmail: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  itemFee: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16A34A',
    marginTop: 4,
  },
  itemUuid: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});

export default DashboardScreen;
