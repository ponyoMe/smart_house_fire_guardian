import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeviceDetailsScreen from '../screens/DeviceDetailsScreen';
import MainTabs from './MainTabs';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="DeviceDetails"
        component={DeviceDetailsScreen}
        options={{ title: 'Device Details', headerShadowVisible: false }}
      />
    </Stack.Navigator>
  );
}
