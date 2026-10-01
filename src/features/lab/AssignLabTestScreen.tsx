import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import apiClient from '../../api/apiClient';

interface LabTest {
  id: string;
  testName: string;
  diseaseCategory: string;
  testCode: string;
  sampleRequired: string;
  cost: number;
  description: string;
}

const CATEGORIES = ['ALL', 'Cardiology', 'Diabetes', 'Infection', 'Renal', 'Hepatic', 'Thyroid'];

const AssignLabTestScreen = ({ route, navigation }: any) => {
  const { appointmentId, patientId, patientName } = route.params || {};

  const [catalog, setCatalog] = useState<LabTest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const fetchCatalog = async () => {
    try {
      const response = await apiClient.get('/lab-tests/catalog', {
        params: { category: selectedCategory === 'ALL' ? undefined : selectedCategory },
      });
      setCatalog(response.data);
    } catch (error) {
      console.error('Failed to load lab catalog:', error);
      Alert.alert('Error', 'Unable to fetch lab test catalog.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectTest = (id: string) => {
    if (selectedTestIds.includes(id)) {
      setSelectedTestIds(selectedTestIds.filter((tId) => tId !== id));
    } else {
      setSelectedTestIds([...selectedTestIds, id]);
    }
  };

  const handleAssign = async () => {
    if (selectedTestIds.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one diagnostic test to assign.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/lab-orders', {
        appointmentId,
        patientId,
        diseaseCondition: selectedCategory !== 'ALL' ? selectedCategory : 'General Evaluation',
        testIds: selectedTestIds,
        doctorNotes: doctorNotes.trim(),
      });

      Alert.alert(
        'Lab Tests Assigned!',
        `${selectedTestIds.length} diagnostic test(s) assigned to ${patientName || 'Patient'}.`,
        [{ text: 'View Lab Orders', onPress: () => navigation.navigate('PatientLabOrders') }]
      );
    } catch (error: any) {
      console.error('Failed to assign lab orders:', error);
      Alert.alert('Assignment Error', error?.response?.data?.message || 'Failed to assign lab tests.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Assign Diagnostic Tests</Text>
      <Text style={styles.subTitle}>Patient: {patientName || 'Selected Patient'}</Text>

      {/* Disease Category Filter Pills */}
      <Text style={styles.sectionLabel}>1. Filter by Disease / Condition</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Master Lab Catalog Selection */}
      <Text style={styles.sectionLabel}>
        2. Select Tests from Master Catalog ({selectedTestIds.length} Selected)
      </Text>

      {loading ? (
        <ActivityIndicator size="medium" color="#2563EB" style={{ marginVertical: 20 }} />
      ) : (
        catalog.map((item) => {
          const isChecked = selectedTestIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.testCard, isChecked && styles.testCardSelected]}
              onPress={() => toggleSelectTest(item.id)}>
              <View style={[styles.checkbox, isChecked && styles.checkboxSelected]}>
                {isChecked ? <Text style={styles.checkIcon}>✓</Text> : null}
              </View>

              <View style={styles.testInfo}>
                <View style={styles.testHeaderRow}>
                  <Text style={styles.testName}>{item.testName}</Text>
                  <Text style={styles.costBadge}>${item.cost?.toFixed(2)}</Text>
                </View>

                <Text style={styles.testCategory}>
                  Category: {item.diseaseCategory} • Sample: {item.sampleRequired}
                </Text>
                {item.description ? (
                  <Text style={styles.testDesc}>{item.description}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Doctor Instructions */}
      <Text style={styles.sectionLabel}>3. Clinical Notes / Instructions</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        value={doctorNotes}
        onChangeText={setDoctorNotes}
        placeholder="Add special sampling instructions or clinical reasoning..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.btnDisabled]}
        onPress={handleAssign}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>
            Assign {selectedTestIds.length} Test(s) to Patient
          </Text>
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
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: '#2563EB',
  },
  pillText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  testCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testInfo: {
    flex: 1,
  },
  testHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 0.8,
  },
  costBadge: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  testCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  testDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#86EFAC',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AssignLabTestScreen;
