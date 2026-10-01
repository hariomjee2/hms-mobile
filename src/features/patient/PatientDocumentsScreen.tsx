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

interface DocumentItem {
  id: string;
  documentName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

const PatientDocumentsScreen = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get('/documents/my');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUploadSampleDoc = async () => {
    setUploading(true);
    try {
      const dummyContent = 'LAB REPORT: Blood Count & Lipid Profile Results. Everything Normal. '.repeat(100);
      const base64Str = btoa(dummyContent);

      await apiClient.post('/documents/base64', {
        base64Data: base64Str,
        fileName: 'Blood_Test_Report_2026.pdf',
        contentType: 'application/pdf',
      });

      Alert.alert('Upload Complete', 'Your lab report document was uploaded securely.');
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Error', error?.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const renderDocCard = ({ item }: { item: DocumentItem }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.docIcon}>📄</Text>
        <View style={styles.docInfo}>
          <Text style={styles.docName}>{item.documentName}</Text>
          <Text style={styles.docMeta}>
            {(item.fileSize / 1024).toFixed(1)} KB • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.securedBadge}>
          <Text style={styles.securedText}>🔒 PRIVATE</Text>
        </View>
      </View>
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
      <Text style={styles.headerTitle}>Medical Records & Lab Reports</Text>
      <Text style={styles.subTitle}>Secured documents (visible only to you & your assigned doctor)</Text>

      <TouchableOpacity
        style={[styles.uploadBtn, uploading && styles.btnDisabled]}
        onPress={handleUploadSampleDoc}
        disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.uploadBtnText}>📤 Upload Lab Report / Record</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={renderDocCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDocuments(); }} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No medical reports uploaded yet.</Text>
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
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  uploadBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#93C5FD',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  docMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  securedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securedText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: 'bold',
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

export default PatientDocumentsScreen;
