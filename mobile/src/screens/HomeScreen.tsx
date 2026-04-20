import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DeviceCard from '../components/device/DeviceCard';
import HeaderBar from '../components/common/HeaderBar';
import RoomChip from '../components/home/RoomChip';
import StatCard from '../components/home/StatCard';
import { useSmartHouse } from '../context/SmartHouseContext';
import { getDeviceSpecificType, getSafetyState } from '../utils/deviceUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: any) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const { devices, updateDeviceCommand } = useSmartHouse();

  useEffect(() => {
    if (devices.length && !selectedRoom) {
      setSelectedRoom(devices[0].room);
    }
    console.log('Devices:', devices);
  }, [devices, selectedRoom]);

  const rooms = useMemo(() => {
    const uniqueRooms = new Set(devices.map(d => d.room));
    return Array.from(uniqueRooms);
  }, [devices]);

  const roomDevices = useMemo(
    () => devices.filter(d => d.room.toLowerCase() === selectedRoom?.toLowerCase()),
    [devices, selectedRoom]
  );

  const getPowerValue = (device: any) =>
    device?.state?.power ?? device?.state?.status ?? 'N/A';

  const getFanValue = (device: any) =>
    device?.state?.fan ?? device?.state?.power ?? device?.state?.status ?? 'N/A';

  const getPumpValue = (device: any) =>
    device?.state?.pump ?? device?.state?.power ?? device?.state?.status ?? 'N/A';

  const getValveValue = (device: any) =>
    device?.state?.valve ?? device?.state?.status ?? 'N/A';

  const getPositionValue = (device: any) =>
    device?.state?.position ?? device?.state?.status ?? 'N/A';

  const getSensorStatus = (device: any) => {
    if (!device) return 'N/A';
    return device.status === 'detected' ? 'Detected' : 'Normal';
  };

  const roomSummaryCards = useMemo(() => {
    if (!selectedRoom) return [];

    const dht22 = roomDevices.find(d => getDeviceSpecificType(d.id) === 'temperatureHumidity');
    const gasSensor = roomDevices.find(d => getDeviceSpecificType(d.id) === 'gasSensor');
    const fan = roomDevices.find(d => getDeviceSpecificType(d.id) === 'fan');
    const gasValve = roomDevices.find(d => getDeviceSpecificType(d.id) === 'gasValve');

    const waterLeakSensor = roomDevices.find(d => getDeviceSpecificType(d.id) === 'waterLeakSensor');
    const waterValve = roomDevices.find(d => getDeviceSpecificType(d.id) === 'waterValve');

    const acs712 = roomDevices.find(d => getDeviceSpecificType(d.id) === 'currentSensor');
    const powerRelay = roomDevices.find(d => getDeviceSpecificType(d.id) === 'powerRelay');

    const flameSensor = roomDevices.find(d => getDeviceSpecificType(d.id) === 'flameSensor');
    const buzzer = roomDevices.find(d => getDeviceSpecificType(d.id) === 'buzzer');
    const pump = roomDevices.find(d => getDeviceSpecificType(d.id) === 'pump');
    const livingWindow = roomDevices.find(d => getDeviceSpecificType(d.id) === 'windowServo');

    const room = selectedRoom.toLowerCase();

    if (room === 'kitchen') {
      return [
        {
          label: 'Temperature',
          value: dht22?.lastTelemetry?.temperature !== undefined
            ? `${dht22.lastTelemetry.temperature}°C`
            : '-',
        },
        {
          label: 'Humidity',
          value: dht22?.lastTelemetry?.humidity !== undefined
            ? `${dht22.lastTelemetry.humidity}%`
            : '-',
        },
        {
          label: 'Gas Status',
          value: getSensorStatus(gasSensor),
        },
        {
          label: 'Fan',
          value: getFanValue(fan),
        },
        {
          label: 'Gas Valve',
          value: getValveValue(gasValve),
        },
      ];
    }

    if (room === 'bedroom') {
      return [
        {
          label: 'Temperature',
          value: dht22?.lastTelemetry?.temperature !== undefined
            ? `${dht22.lastTelemetry.temperature}°C`
            : '-',
        },
        {
          label: 'Humidity',
          value: dht22?.lastTelemetry?.humidity !== undefined
            ? `${dht22.lastTelemetry.humidity}%`
            : '-',
        },
        {
          label: 'Window',
          value: getPositionValue(
            roomDevices.find(d => getDeviceSpecificType(d.id) === 'windowServo')
          ),
        },
      ];
    }

    if (room === 'bathroom') {
      return [
        {
          label: 'Water Leak',
          value: getSensorStatus(waterLeakSensor),
        },
        {
          label: 'Water Valve',
          value: getValveValue(waterValve),
        },
      ];
    }

    if (room === 'tech') {
      return [
        {
          label: 'Current',
          value: acs712?.lastTelemetry?.current !== undefined
            ? `${acs712.lastTelemetry.current}`
            : '-',
        },
        {
          label: 'Power Relay',
          value: getPowerValue(powerRelay),
        },
      ];
    }

    if (room === 'living') {
      return [
        {
          label: 'Flame Sensor',
          value: getSensorStatus(flameSensor),
        },
        {
          label: 'Buzzer',
          value: getPowerValue(buzzer),
        },
        {
          label: 'Mini Pump',
          value: getPumpValue(pump),
        },
        {
          label: 'Window',
          value: getPositionValue(livingWindow),
        },
      ];
    }

    return [];
  }, [roomDevices, selectedRoom]);

  const safety = getSafetyState(devices);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomsRow}
        >
          {rooms.map(room => (
            <RoomChip
              key={room}
              label={room}
              active={room.toLowerCase() === selectedRoom?.toLowerCase()}
              onPress={() => setSelectedRoom(room)}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{`Room Summary (${selectedRoom ?? '-'})`}</Text>
        <View style={styles.statsGrid}>
          {roomSummaryCards.map(card => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
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