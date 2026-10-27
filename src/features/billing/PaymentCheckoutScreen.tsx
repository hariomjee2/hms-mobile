import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import apiClient from '../../api/apiClient';

const PaymentCheckoutScreen = ({ route, navigation }: any) => {
  const { invoiceId, amount, doctorName } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('882');
  const [utr, setUtr] = useState('');
  const [processing, setProcessing] = useState(false);

  // Dynamic QR Code State
  const [qrDetails, setQrDetails] = useState<{
    qrCodeBase64?: string;
    upiUrl?: string;
    merchantVpa?: string;
    merchantName?: string;
    paymentStatus?: string;
  } | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Fetch Dynamic QR Code details when invoiceId is available
  useEffect(() => {
    if (invoiceId) {
      fetchPaymentQrDetails();
    }
  }, [invoiceId]);

  // Real-time status polling for auto-detecting payment completion on Web & Mobile
  useEffect(() => {
    if (!invoiceId || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/invoices/${invoiceId}/status`);
        if (response.data?.status === 'PAID') {
          setIsPaid(true);
          clearInterval(interval);
          Alert.alert(
            '🎉 Payment Completed!',
            'Your payment has been successfully recorded. Thank you!',
            [{ text: 'View Invoices', onPress: () => navigation.goBack() }]
          );
        }
      } catch (err) {
        // Silently handle polling check error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [invoiceId, isPaid]);

  const fetchPaymentQrDetails = async () => {
    setLoadingQr(true);
    try {
      const response = await apiClient.get(`/invoices/${invoiceId}/payment-details`);
      setQrDetails(response.data);
      if (response.data.paymentStatus === 'PAID') {
        setIsPaid(true);
      }
    } catch (error) {
      console.error('Failed to load QR Payment details:', error);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleOpenUpiApp = async () => {
    if (!qrDetails?.upiUrl) {
      Alert.alert('Payment Error', 'UPI URL is not ready.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(qrDetails.upiUrl);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(qrDetails.upiUrl);
      } else {
        Alert.alert('UPI App Required', 'No UPI application found. Please scan the QR code using Google Pay, PhonePe, or Paytm.');
      }
    } catch (err) {
      console.error('Failed to launch UPI App:', err);
      Alert.alert('Launch Error', 'Could not launch payment app. Please scan the QR code manually.');
    }
  };

  const handleVerifyUtrPayment = async () => {
    setProcessing(true);
    try {
      const response = await apiClient.post(`/invoices/${invoiceId}/verify-payment`, {
        utr: utr.trim() || `UTR_${Date.now()}`,
      });

      const txnRef = response.data.transactionRef || 'TXN_SUCCESS';
      setIsPaid(true);

      Alert.alert(
        '🎉 Payment Verified!',
        `Transaction Reference: ${txnRef}\nAmount Paid: $${amount?.toFixed(2) || '0.00'}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      Alert.alert('Verification Error', error?.response?.data?.message || 'Could not verify transaction.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setProcessing(true);
    try {
      const response = await apiClient.post(`/invoices/${invoiceId}/pay`, {
        paymentMethod: paymentMethod === 'CARD' ? 'CREDIT_CARD' : paymentMethod,
      });

      const txnRef = response.data.transactionRef || 'TXN_SUCCESS';
      setIsPaid(true);

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
      <Text style={styles.subTitle}>Scan QR Code or select payment option to settle consultation invoice</Text>

      {/* Invoice Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>TOTAL AMOUNT DUE</Text>
        <Text style={styles.summaryAmount}>${amount?.toFixed(2) || '150.00'}</Text>
        <Text style={styles.summaryDoctor}>Service: Consultation with {doctorName || 'Hospital Specialist'}</Text>
        <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
          <Text style={styles.statusBadgeText}>{isPaid ? '✓ PAID' : '• PAYMENT PENDING'}</Text>
        </View>
      </View>

      {/* Payment Method Selector */}
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <View style={styles.methodContainer}>
        <TouchableOpacity
          style={[styles.methodOption, paymentMethod === 'UPI' && styles.methodSelected]}
          onPress={() => setPaymentMethod('UPI')}>
          <Text style={styles.methodIcon}>📲</Text>
          <View>
            <Text style={[styles.methodText, paymentMethod === 'UPI' && styles.methodTextSelected]}>
              UPI QR Code & Instant Apps
            </Text>
            <Text style={styles.methodSubText}>GPay, PhonePe, Paytm, BHIM, Cred</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodOption, paymentMethod === 'CARD' && styles.methodSelected]}
          onPress={() => setPaymentMethod('CARD')}>
          <Text style={styles.methodIcon}>💳</Text>
          <View>
            <Text style={[styles.methodText, paymentMethod === 'CARD' && styles.methodTextSelected]}>
              Credit / Debit Card
            </Text>
            <Text style={styles.methodSubText}>Visa, MasterCard, RuPay</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodOption, paymentMethod === 'NET_BANKING' && styles.methodSelected]}
          onPress={() => setPaymentMethod('NET_BANKING')}>
          <Text style={styles.methodIcon}>🏦</Text>
          <View>
            <Text style={[styles.methodText, paymentMethod === 'NET_BANKING' && styles.methodTextSelected]}>
              Net Banking / Health Insurance
            </Text>
            <Text style={styles.methodSubText}>Direct Bank Transfer & TPA Claim</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Dynamic UPI QR Code Display Section */}
      {paymentMethod === 'UPI' ? (
        <View style={styles.qrCard}>
          <Text style={styles.qrCardTitle}>Scan QR Code to Pay</Text>
          <Text style={styles.qrCardSub}>Use any UPI app on your mobile phone</Text>

          {loadingQr ? (
            <View style={styles.qrLoadingBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.qrLoadingText}>Generating Dynamic QR Code...</Text>
            </View>
          ) : qrDetails?.qrCodeBase64 ? (
            <View style={styles.qrImageContainer}>
              <Image
                source={{ uri: qrDetails.qrCodeBase64 }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.vpaText}>
                Payee VPA: <Text style={styles.vpaBold}>{qrDetails.merchantVpa || 'hms.hospital@upi'}</Text>
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.reloadQrBtn} onPress={fetchPaymentQrDetails}>
              <Text style={styles.reloadQrText}>🔄 Refresh QR Code</Text>
            </TouchableOpacity>
          )}

          {/* Direct Pay via UPI App Action */}
          <TouchableOpacity style={styles.launchUpiBtn} onPress={handleOpenUpiApp}>
            <Text style={styles.launchUpiBtnText}>⚡ Pay via Installed UPI App</Text>
          </TouchableOpacity>

          {/* Manual UTR Reference Input */}
          <View style={styles.utrSection}>
            <Text style={styles.inputLabel}>Enter 12-Digit Bank UTR / Transaction Ref</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 428901928374"
              placeholderTextColor="#94A3B8"
              value={utr}
              onChangeText={setUtr}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={[styles.verifyBtn, processing && styles.btnDisabled]}
              onPress={handleVerifyUtrPayment}
              disabled={processing}>
              {processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify & Confirm Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Card Input Section */}
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

          <TouchableOpacity
            style={[styles.payBtn, processing && styles.btnDisabled]}
            onPress={handleCardPayment}
            disabled={processing}>
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payBtnText}>Confirm Card Payment (${amount?.toFixed(2)})</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Net Banking Section */}
      {paymentMethod === 'NET_BANKING' ? (
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Selected Health Insurance Provider</Text>
          <TextInput style={styles.textInput} value="HDFC ERGO / Star Health Claim - Direct Settlement" editable={false} />

          <TouchableOpacity
            style={[styles.payBtn, processing && styles.btnDisabled]}
            onPress={handleCardPayment}
            disabled={processing}>
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payBtnText}>Submit Claim Settlement</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
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
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
  },
  statusPaid: {
    backgroundColor: '#16A34A',
  },
  statusPending: {
    backgroundColor: '#D97706',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
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
    fontSize: 24,
    marginRight: 12,
  },
  methodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  methodSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  methodTextSelected: {
    color: '#2563EB',
    fontWeight: 'bold',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  qrCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  qrCardSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  qrLoadingBox: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLoadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  qrImageContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  vpaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  vpaBold: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  reloadQrBtn: {
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginVertical: 10,
  },
  reloadQrText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  launchUpiBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  launchUpiBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  utrSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
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
    fontWeight: '600',
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
    marginBottom: 12,
  },
  verifyBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
