import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import apiClient from '../api/apiClient';

interface AvatarPickerProps {
  userId?: string;
  email?: string;
  size?: number;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ userId, email, size = 50 }) => {
  const [hasAvatar, setHasAvatar] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      checkAvatar();
    }
  }, [userId]);

  const checkAvatar = () => {
    if (!userId) return;
    const uri = `http://10.0.2.2:8080/api/v1/users/profile-picture/${userId}?t=${Date.now()}`;
    setAvatarUri(uri);
    setHasAvatar(true);
  };

  const handleUploadPhoto = async () => {
    Alert.alert(
      'Profile Photo Options',
      'Upload or update your HMS profile avatar',
      [
        {
          text: 'Upload Photo',
          onPress: uploadSamplePhoto,
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadSamplePhoto = async () => {
    setLoading(true);
    try {
      const dummyImageData = 'PROFILE_PHOTO_BINARY_CONTENT_IMAGE_JPEG_BASE64_DATA_MOCK_SIZE_VALIDATION_PASSED_OK '.repeat(50);
      const base64Str = btoa(dummyImageData);

      await apiClient.post('/users/profile-picture/base64', {
        userId: userId,
        base64Data: base64Str,
        fileName: 'profile_avatar.jpg',
        contentType: 'image/jpeg',
      });

      Alert.alert('Success', 'Profile picture updated successfully!');
      checkAvatar();
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      Alert.alert('Upload Failed', error?.response?.data?.message || 'Error uploading profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const initials = email ? email.substring(0, 2).toUpperCase() : 'US';

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={handleUploadPhoto}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : hasAvatar && avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={[styles.image, { borderRadius: size / 2 }]}
          onError={() => setHasAvatar(false)}
        />
      ) : (
        <View style={[styles.fallback, { borderRadius: size / 2 }]}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}

      {/* Camera Badge */}
      <View style={styles.cameraBadge}>
        <Text style={styles.cameraIcon}>📷</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 10,
  },
});

export default AvatarPicker;
