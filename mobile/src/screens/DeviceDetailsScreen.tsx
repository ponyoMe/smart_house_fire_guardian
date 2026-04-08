import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InfoRow from '../components/common/InfoRow';
import StatusBadge from '../components/common/StatusBadge';
import { useSmartHouse } from '../context/SmartHouseContext';
import { formatLastSeen, getDeviceSpecificType } from '../utils/deviceUtils';

export default function DeviceDetailsScreen({ route }: any) {
  const { deviceId } = route.params;
  const { devices, updateDeviceCommand } = useSmartHouse();
  const device = devices.find(d => d.id === deviceId);

  if (!device) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFound}>Device not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>{device.name}</Text>
          <Text style={styles.subtitle}>{device.room}</Text>
          <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
            <StatusBadge status={device.status} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <InfoRow label="Last seen" value={formatLastSeen(device.lastSeen)} />
          <InfoRow label="Type" value={device.type} />
          <InfoRow label="Name" value={device.name} />
        </View>

        { getDeviceSpecificType(device.id) === 'sensor' ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Telemetry</Text>
            {device.name === 'gasSensor' && (
              <>
                <InfoRow label="Gas detected" value={String(device.lastTelemetry?.gasDetected ?? false)} />
                <InfoRow label="Raw value" value={`${device.lastTelemetry?.rawValue ?? '-'} ppm`} />
              </>
            )}
            {device.lastTelemetry?.temperature !== undefined && (
              <InfoRow label="Temperature" value={`${device.lastTelemetry.temperature}°C`} />
            )}
            {device.lastTelemetry?.humidity !== undefined && (
              <InfoRow label="Humidity" value={`${device.lastTelemetry.humidity}%`} />
            )}
            {device.lastTelemetry?.waterLeak !== undefined && (
              <InfoRow label="Water leak" value={String(device.lastTelemetry.waterLeak)} />
            )}
            {device.lastTelemetry?.smokeDetected !== undefined && (
              <InfoRow label="Smoke detected" value={String(device.lastTelemetry.smokeDetected)} />
            )}
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Current State</Text>
              {device.state?.power && <InfoRow label="Power" value={device.state.power} />}
              {device.state?.position && <InfoRow label="Position" value={device.state.position} />}
              {device.state?.valve && <InfoRow label="Valve" value={device.state.valve} />}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Controls</Text>

              {getDeviceSpecificType(device.id) === 'fan' && (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => updateDeviceCommand(device.id, { power: 'ON' })}>
                    <Text style={styles.primaryButtonText}>Turn ON</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => updateDeviceCommand(device.id, { power: 'OFF' })}>
                    <Text style={styles.secondaryButtonText}>Turn OFF</Text>
                  </TouchableOpacity>
                </>
              )}

              {getDeviceSpecificType(device.id) === 'windowServo' && (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => updateDeviceCommand(device.id, { position: 'OPEN' })}>
                    <Text style={styles.primaryButtonText}>Open Window</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => updateDeviceCommand(device.id, { position: 'CLOSED' })}>
                    <Text style={styles.secondaryButtonText}>Close Window</Text>
                  </TouchableOpacity>
                </>
              )}

              {getDeviceSpecificType(device.id) === 'gasValve' && (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => updateDeviceCommand(device.id, { valve: 'OPEN' })}>
                    <Text style={styles.primaryButtonText}>Open Valve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => updateDeviceCommand(device.id, { valve: 'CLOSED' })}>
                    <Text style={styles.secondaryButtonText}>Close Valve</Text>
                  </TouchableOpacity>
                </>
              )}

              {getDeviceSpecificType(device.id) === 'relay' && (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => updateDeviceCommand(device.id, { power: 'ON' })}>
                    <Text style={styles.primaryButtonText}>Turn ON</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => updateDeviceCommand(device.id, { power: 'OFF' })}>
                    <Text style={styles.secondaryButtonText}>Turn OFF</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 4, fontSize: 15, color: '#64748B' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#334155', fontSize: 15, fontWeight: '700' },
  notFound: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
});
