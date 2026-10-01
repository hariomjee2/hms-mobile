import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLoginPressed = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { token, id, email, roles } = response.data;
      await login({ id, email, roles }, token);
    } catch (e: any) {
      console.error('Login error:', e);
      Alert.alert('Login Failed', e.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>HMS System</Text>

      <CustomInput
        name="email"
        placeholder="Email"
        control={control as any}
        keyboardType="email-address"
      />
      <CustomInput
        name="password"
        placeholder="Password"
        secureTextEntry
        control={control as any}
      />

      <CustomButton
        text={loading ? 'Logging in...' : 'Log In'}
        onPress={handleSubmit(onLoginPressed)}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
  },
});

export default LoginScreen;
