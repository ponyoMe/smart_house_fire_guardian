import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';  // Using useNavigation hook
import axios from 'axios'; // For making HTTP requests
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons'; // Importing the icon library
import { setAuthToken } from '../services/api';
import { useSmartHouse } from '../context/SmartHouseContext';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export type RootStackParamList = {
  Login: undefined;
  DeviceDetails: { deviceId: string };
  MainTabs: undefined;
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const { initializeNotifications } = useSmartHouse();
  const [houseNumber, setHouseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility

  const handleLogin = async () => {
    if (!houseNumber || !password) {
      Alert.alert('Please fill in both fields');
      return;
    }

    try {
      const response = await axios.post('http://192.168.0.6:3000/auth/login', {
        username: houseNumber,
        password,
      });

      const { access_token } = response.data;
      console.log('JWT Token:', access_token);
      setAuthToken(access_token);
      await initializeNotifications();

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });

    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login failed', 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to the Smart Home</Text>

      <TextInput
        style={styles.input}
        placeholder="House Number"
        value={houseNumber}
        onChangeText={setHouseNumber}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible} // Toggle password visibility
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Icon
            name={isPasswordVisible ? 'eye-off' : 'eye'} // Toggle icon based on visibility state
            size={24}
            color="#007BFF"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    height: 50,
    flex: 1, // Ensure the password input takes full width within the container
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;