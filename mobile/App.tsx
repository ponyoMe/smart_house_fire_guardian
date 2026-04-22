import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { SmartHouseProvider } from './src/context/SmartHouseContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8FAFC',
  },
};



export default function App() {
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
