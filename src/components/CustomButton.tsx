import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CustomButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({ onPress, text, disabled }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, disabled && styles.containerDisabled]}
      disabled={disabled}
    >
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0066CC',
    width: '100%',
    padding: 15,
    marginVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  containerDisabled: {
    backgroundColor: '#A0C4E8',
  },
  text: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
});

export default CustomButton;
