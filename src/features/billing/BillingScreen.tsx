import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface Invoice {
  id: string;
  doctorName: string;
  amount: number;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod: string;
  transactionRef: string;
  paidAt: string;
  createdAt: string;
}

const BillingScreen = ({ navigation }: any) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInvoices();
    });
    fetchInvoices();
    return unsubscribe;
  }, [navigation]);

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.get('/invoices/my');
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const isPaid = item.paymentStatus === 'PAID';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceTitle}>Consultation Fee</Text>
            <Text style={styles.doctorSub}>{item.doctorName || 'Hospital Service'}</Text>
          </View>
          <View style={[styles.badge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
            <Text style={[styles.badgeText, isPaid ? styles.paidText : styles.unpaidText]}>
              {item.paymentStatus}
            </Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount:</Text>
          <Text style={styles.amountVal}>${item.amount?.toFixed(2)}</Text>
        </View>

        <Text style={styles.dateText}>
          Billed Date: {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        {!isPaid ? (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() =>
              navigation.navigate('PaymentCheckout', {
                invoiceId: item.id,
                amount: item.amount,
                doctorName: item.doctorName,
              })
            }>
            <Text style={styles.payBtnText}>💳 Proceed to Payment Checkout →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidInfoBox}>
            <Text style={styles.paidDateText}>
              ✓ Paid via {item.paymentMethod || 'Card'} on {new Date(item.paidAt || item.createdAt).toLocaleDateString()}
            </Text>
            {item.transactionRef ? (
              <Text style={styles.txnRefText}>Ref: {item.transactionRef}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Billing & Invoices</Text>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoiceCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No invoices or billing statements found.</Text>
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  doctorSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unpaidBadge: {
    backgroundColor: '#FEE2E2',
  },
  paidBadge: {
    backgroundColor: '#DCFCE7',
  },
  unpaidText: {
    color: '#991B1B',
    fontWeight: 'bold',
    fontSize: 11,
  },
  paidText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 11,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  amountVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  payBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paidInfoBox: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paidDateText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: 'bold',
  },
  txnRefText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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

export default BillingScreen;
