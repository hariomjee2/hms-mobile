import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import PatientHomeScreen from '../features/patient/PatientHomeScreen';
import DoctorHomeScreen from '../features/doctor/DoctorHomeScreen';
import BookAppointmentScreen from '../features/appointments/BookAppointmentScreen';
import MyAppointmentsScreen from '../features/appointments/MyAppointmentsScreen';
import DoctorQueueScreen from '../features/doctor/DoctorQueueScreen';
import CreatePrescriptionScreen from '../features/prescriptions/CreatePrescriptionScreen';
import PrescriptionsScreen from '../features/prescriptions/PrescriptionsScreen';
import BillingScreen from '../features/billing/BillingScreen';
import AddDoctorScreen from '../features/admin/AddDoctorScreen';
import PaymentCheckoutScreen from '../features/billing/PaymentCheckoutScreen';
import PatientDocumentsScreen from '../features/patient/PatientDocumentsScreen';
import AssignLabTestScreen from '../features/lab/AssignLabTestScreen';
import PatientLabOrdersScreen from '../features/lab/PatientLabOrdersScreen';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  const { user } = useAuthStore();

  const getHomeScreen = () => {
    const roles = user?.roles || [];
    if (roles.includes('ROLE_PATIENT')) {
      return PatientHomeScreen;
    }
    if (roles.includes('ROLE_DOCTOR')) {
      return DoctorHomeScreen;
    }
    return DashboardScreen;
  };

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={getHomeScreen()}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{ title: 'Book Appointment' }}
      />
      <Stack.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <Stack.Screen
        name="DoctorQueue"
        component={DoctorQueueScreen}
        options={{ title: 'Consultation Cabin' }}
      />
      <Stack.Screen
        name="CreatePrescription"
        component={CreatePrescriptionScreen}
        options={{ title: 'Issue Prescription' }}
      />
      <Stack.Screen
        name="Prescriptions"
        component={PrescriptionsScreen}
        options={{ title: 'My Prescriptions' }}
      />
      <Stack.Screen
        name="Billing"
        component={BillingScreen}
        options={{ title: 'Billing & Invoices' }}
      />
      <Stack.Screen
        name="PaymentCheckout"
        component={PaymentCheckoutScreen}
        options={{ title: 'Payment Checkout' }}
      />
      <Stack.Screen
        name="PatientDocuments"
        component={PatientDocumentsScreen}
        options={{ title: 'Medical Records' }}
      />
      <Stack.Screen
        name="AssignLabTest"
        component={AssignLabTestScreen}
        options={{ title: 'Assign Lab Tests' }}
      />
      <Stack.Screen
        name="PatientLabOrders"
        component={PatientLabOrdersScreen}
        options={{ title: 'Lab Test Orders' }}
      />
      <Stack.Screen
        name="AddDoctor"
        component={AddDoctorScreen}
        options={{ title: 'Onboard Doctor' }}
      />
    </Stack.Navigator>
  );
};

export default MainStack;
