import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/apiClient';

interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStats();
    });
    fetchStats();
    return unsubscribe;
  }, [navigation]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.greetingText}>Hospital Operations</Text>
          <Text style={styles.userName}>{user?.email || 'Administrator'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Revenue Card */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>TOTAL REVENUE COLLECTED</Text>
        <Text style={styles.revenueValue}>
          ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
        </Text>
        <Text style={styles.revenueSub}>Aggregated from paid consultation invoices</Text>
      </View>

      {/* KPI Grid */}
      <Text style={styles.sectionTitle}>Executive Metrics</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>👥</Text>
          <Text style={styles.kpiNumber}>{stats?.totalPatients || 0}</Text>
          <Text style={styles.kpiLabel}>Registered Patients</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>👨‍⚕️</Text>
          <Text style={styles.kpiNumber}>{stats?.totalDoctors || 0}</Text>
          <Text style={styles.kpiLabel}>Active Doctors</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>📅</Text>
          <Text style={styles.kpiNumber}>{stats?.totalAppointments || 0}</Text>
          <Text style={styles.kpiLabel}>Total Bookings</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>✅</Text>
          <Text style={[styles.kpiNumber, { color: '#16A34A' }]}>
            {stats?.completedAppointments || 0}
          </Text>
          <Text style={styles.kpiLabel}>Completed Visits</Text>
        </View>
      </View>

      {/* Staff Operations */}
      <Text style={styles.sectionTitle}>Staff Management</Text>
      <TouchableOpacity
        style={styles.onboardBtn}
        onPress={() => navigation.navigate('AddDoctor')}>
        <Text style={styles.onboardBtnText}>👨‍⚕️ + Onboard New Doctor</Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 14,
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
    fontSize: 18,
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
    elevation: 2,
  },
  kpiIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  onboardBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  onboardBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
