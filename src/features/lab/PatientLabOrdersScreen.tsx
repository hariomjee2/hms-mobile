import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface LabOrder {
  id: string;
  patientName: string;
  doctorName: string;
  testName: string;
  testCode: string;
  diseaseCategory: string;
  sampleRequired: string;
  cost: number;
  status: 'ORDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  doctorNotes: string;
  resultSummary: string;
  createdAt: string;
}

const PatientLabOrdersScreen = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal for entering test result summary
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultInput, setResultInput] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/lab-orders/my');
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load lab orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, summary?: string) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/lab-orders/${orderId}/status`, {
        status: newStatus,
        resultSummary: summary || 'Normal lab test findings.',
      });
      Alert.alert('Status Updated', `Lab test order marked as ${newStatus}.`);
      setModalVisible(false);
      fetchOrders();
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert('Error', 'Failed to update lab order status.');
    } finally {
      setUpdating(false);
    }
  };

  const openCompleteModal = (order: LabOrder) => {
    setSelectedOrder(order);
    setResultInput(order.resultSummary || 'All parameters within healthy reference range.');
    setModalVisible(true);
  };

  const renderBadge = (status: string) => {
    let bg = '#EFF6FF';
    let text = '#1E40AF';

    if (status === 'COMPLETED') {
      bg = '#DCFCE7';
      text = '#166534';
    } else if (status === 'SKIPPED') {
      bg = '#F3F4F6';
      text = '#6B7280';
    } else if (status === 'ORDERED') {
      bg = '#FEF3C7';
      text = '#854D0E';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: LabOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 0.8 }}>
          <Text style={styles.testName}>{item.testName}</Text>
          <Text style={styles.categoryText}>
            {item.diseaseCategory} • Sample: {item.sampleRequired}
          </Text>
        </View>
        {renderBadge(item.status)}
      </View>

      <Text style={styles.doctorText}>Assigned by {item.doctorName}</Text>

      {item.doctorNotes ? (
        <Text style={styles.notesText}>Instructions: {item.doctorNotes}</Text>
      ) : null}

      {item.resultSummary ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>TEST RESULTS / FINDINGS:</Text>
          <Text style={styles.resultVal}>{item.resultSummary}</Text>
        </View>
      ) : null}

      {/* Interactive Actions */}
      {item.status === 'ORDERED' || item.status === 'IN_PROGRESS' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            onPress={() => openCompleteModal(item)}>
            <Text style={styles.btnText}>✓ Mark Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={() => handleUpdateStatus(item.id, 'SKIPPED')}>
            <Text style={styles.skipBtnText}>⏭ Skip Test</Text>
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
      <Text style={styles.headerTitle}>Diagnostic Lab Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No diagnostic lab orders found.</Text>
          </View>
        }
      />

      {/* Modal for entering Result Summary */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete Diagnostic Test</Text>
            <Text style={styles.modalSub}>{selectedOrder?.testName}</Text>

            <Text style={styles.modalLabel}>Enter Result Findings Summary:</Text>
            <TextInput
              style={styles.modalInput}
              value={resultInput}
              onChangeText={setResultInput}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() =>
                  selectedOrder &&
                  handleUpdateStatus(selectedOrder.id, 'COMPLETED', resultInput)
                }
                disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Save Results</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  categoryText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  doctorText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  resultBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
  },
  resultVal: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
  completeBtn: {
    backgroundColor: '#16A34A',
  },
  skipBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  skipBtnText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default PatientLabOrdersScreen;
