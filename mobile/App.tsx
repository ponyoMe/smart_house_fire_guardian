import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { SmartHouseProvider } from './src/context/SmartHouseContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAFC',
  },
};



export default function App() {
  useEffect(() => {
  async function init() {
    await messaging().requestPermission();

    const token = await messaging().getToken();
    console.log('FCM TOKEN:', token);
  }

  init();

  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Notification received:', remoteMessage);
  });

  return unsubscribe; // cleanup
}, []);
  return (
    <SafeAreaProvider>
    <SmartHouseProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <RootNavigator />
      </NavigationContainer>
    </SmartHouseProvider>
    </SafeAreaProvider>
  );
}
