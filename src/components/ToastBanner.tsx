import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ToastBannerProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const ToastBanner: React.FC<ToastBannerProps> = ({
  visible,
  message,
  type = 'success',
  onClose,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#EF4444';
      case 'info':
        return '#2563EB';
      case 'success':
      default:
        return '#16A34A';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'success':
      default:
        return '🎉';
    }
  };

  return (
    <View style={[styles.bannerContainer, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.bannerIcon}>{getIcon()}</Text>
      <Text style={styles.bannerMessage}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  bannerMessage: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ToastBanner;
