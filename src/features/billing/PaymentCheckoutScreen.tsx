import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../api/apiClient';

const PaymentCheckoutScreen = ({ route, navigation }: any) => {
  const { invoiceId, amount, doctorName } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'NET_BANKING'>('CARD');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('882');
  const [upiId, setUpiId] = useState('patient@okicici');
  const [processing, setProcessing] = useState(false);

  const handleProcessPayment = async () => {
    setProcessing(true);
    try {
      const response = await apiClient.post(`/invoices/${invoiceId}/pay`, {
        paymentMethod: paymentMethod === 'CARD' ? 'CREDIT_CARD' : paymentMethod,
      });

      const txnRef = response.data.transactionRef || 'TXN_SUCCESS';

      Alert.alert(
        '🎉 Payment Successful!',
        `Receipt Reference: ${txnRef}\nAmount Paid: $${amount?.toFixed(2)}\nMethod: ${paymentMethod}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Payment failed:', error);
      Alert.alert('Payment Error', error?.response?.data?.message || 'Transaction could not be processed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Checkout & Payment</Text>
      <Text style={styles.subTitle}>Select payment option to settle consultation invoice</Text>

      {/* Invoice Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL AMOUNT DUE</Text>
        <Text style={styles.summaryAmount}>${amount?.toFixed(2) || '150.00'}</Text>
        <Text style={styles.summaryDoctor}>Service: Consultation with {doctorName || 'Hospital Specialist'}</Text>
      </View>

      {/* Payment Method Selector */}
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.methodContainer}>
        <TouchableOpacity
          style={[styles.methodOption, paymentMethod === 'CARD' && styles.methodSelected]}
          onPress={() => setPaymentMethod('CARD')}>
          <Text style={styles.methodIcon}>💳</Text>
          <Text style={[styles.methodText, paymentMethod === 'CARD' && styles.methodTextSelected]}>
            Credit / Debit Card
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodOption, paymentMethod === 'UPI' && styles.methodSelected]}
          onPress={() => setPaymentMethod('UPI')}>
          <Text style={styles.methodIcon}>📱</Text>
          <Text style={[styles.methodText, paymentMethod === 'UPI' && styles.methodTextSelected]}>
            UPI / QR Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodOption, paymentMethod === 'NET_BANKING' && styles.methodSelected]}
          onPress={() => setPaymentMethod('NET_BANKING')}>
          <Text style={styles.methodIcon}>🏦</Text>
          <Text style={[styles.methodText, paymentMethod === 'NET_BANKING' && styles.methodTextSelected]}>
            Net Banking / Claim
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Payment Details Input */}
      {paymentMethod === 'CARD' ? (
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Card Number</Text>
          <TextInput style={styles.textInput} value={cardNumber} onChangeText={setCardNumber} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput style={styles.textInput} value={expiry} onChangeText={setExpiry} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>CVV Code</Text>
              <TextInput
                style={styles.textInput}
                value={cvv}
                onChangeText={setCvv}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      ) : null}

      {paymentMethod === 'UPI' ? (
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Virtual Payment Address (UPI ID)</Text>
          <TextInput style={styles.textInput} value={upiId} onChangeText={setUpiId} />
        </View>
      ) : null}

      {paymentMethod === 'NET_BANKING' ? (
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Selected Bank</Text>
          <TextInput style={styles.textInput} value="Chase / Bank of America - Health Claim" editable={false} />
        </View>
      ) : null}

      {/* Confirm Payment Button */}
      <TouchableOpacity
        style={[styles.payBtn, processing && styles.btnDisabled]}
        onPress={handleProcessPayment}
        disabled={processing}>
        {processing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payBtnText}>Confirm & Pay ${amount?.toFixed(2)}</Text>
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
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summaryAmount: {
    color: '#38BDF8',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryDoctor: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  methodContainer: {
    marginBottom: 16,
  },
  methodOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  methodSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  methodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  methodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  methodTextSelected: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  payBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#86EFAC',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentCheckoutScreen;
