import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DeviceCard from '../components/device/DeviceCard';
import HeaderBar from '../components/common/HeaderBar';
import RoomChip from '../components/home/RoomChip';
import StatCard from '../components/home/StatCard';
import { useSmartHouse } from '../context/SmartHouseContext';
import { getDeviceSpecificType, getSafetyState } from '../utils/deviceUtils';
import {  useSafeAreaInsets } from 'react-native-safe-area-context';


export default function HomeScreen({ navigation }: any) {

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const { devices, updateDeviceCommand } = useSmartHouse();

  useEffect(() => {
  if (devices.length && !selectedRoom) {
    setSelectedRoom(devices[0].room);
  }
}, [devices]);

   const rooms = useMemo(() => {
  const uniqueRooms = new Set(devices.map(d => d.room));
  return Array.from(uniqueRooms);
}, [devices]);

  const roomDevices = useMemo(() => devices.filter(d => d.room.toLowerCase() === selectedRoom?.toLowerCase()), [devices, selectedRoom]);
  const roomSensors = roomDevices.filter(d => d.type === 'sensor');
  const roomActuators = roomDevices.filter(d => d.type === 'actuator');

  const roomSummary = {
    temperature: roomSensors.find(d => d.lastTelemetry?.temperature !== undefined)?.lastTelemetry?.temperature,
    humidity: roomSensors.find(d => d.lastTelemetry?.humidity !== undefined)?.lastTelemetry?.humidity,
    gasStatus: roomDevices.some(d => d.id.includes('mq2') && d.status === 'detected')
  ? 'Detected'
  : 'Normal',
    fanState: roomActuators.find(d => getDeviceSpecificType(d.id) === 'fan')?.state?.power ?? '-',
    gasValve: roomActuators.find(d => getDeviceSpecificType(d.id) === 'gasValve')?.state?.valve ?? '-',
  };

  const safety = getSafetyState(devices);
  const insets = useSafeAreaInsets()

  return (
    
    <SafeAreaView style={[  styles.safeArea, { paddingTop: insets.top } ]}>
      <ScrollView contentContainerStyle={styles.content}>
        <HeaderBar title="Smart House" />

        <View style={[styles.safetyBanner, { borderLeftColor: safety.color }]}> 
          <View>
            <Text style={styles.safetyTitle}>Safety state</Text>
            <Text style={[styles.safetyValue, { color: safety.color }]}>{safety.label}</Text>
          </View>
          <Icon name="shield-checkmark-outline" size={26} color={safety.color} />
        </View>

        <Text style={styles.sectionTitle}>Rooms</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomsRow}>
          {rooms.map(room => (
       <RoomChip
        key={room}
        label={room}
        active={room.toLowerCase() === selectedRoom?.toLowerCase()}
        onPress={() => setSelectedRoom(room)}
       />
     ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{`Room Summary (${selectedRoom})`}</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Temperature" value={`${roomSummary.temperature ?? '-'}°C`} />
          <StatCard label="Humidity" value={`${roomSummary.humidity ?? '-'}%`} />
          <StatCard label="Gas Status" value={roomSummary.gasStatus} />
          <StatCard label="Fan" value={roomSummary.fanState} />
          <StatCard label="Gas Valve" value={roomSummary.gasValve} />
        </View>

        <Text style={styles.sectionTitle}>Devices</Text>
        {roomDevices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            onPress={() => navigation.navigate('DeviceDetails', { deviceId: device.id })}
            onQuickCommand={updateDeviceCommand}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  safetyBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 5,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyTitle: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  safetyValue: { fontSize: 22, fontWeight: '700' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 12,
  },
  roomsRow: { paddingBottom: 8 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
