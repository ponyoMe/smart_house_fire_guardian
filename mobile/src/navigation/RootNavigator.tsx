import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeviceDetailsScreen from '../screens/DeviceDetailsScreen';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';  // Import the Login screen
import { RootStackParamList } from '../screens/LoginScreen'; 

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      {/* Add the Login screen as the first screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeviceDetails"
        component={DeviceDetailsScreen}
        options={{ title: 'Device Details', headerShadowVisible: false }}
      />
    </Stack.Navigator>
  );
}