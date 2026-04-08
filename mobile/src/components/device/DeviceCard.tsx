import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Device, DeviceState } from '../../types';
import { formatLastSeen, getDeviceSpecificType } from '../../utils/deviceUtils';
import InfoRow from '../common/InfoRow';
import StatusBadge from '../common/StatusBadge';

type Props = {
  device: Device;
  onPress: () => void;
  onQuickCommand: (deviceId: string, command: Partial<DeviceState>) => void;
};

export default function DeviceCard({ device, onPress, onQuickCommand }: Props) {
  const isFan = getDeviceSpecificType(device.id) === 'fan';
  const isWindow = getDeviceSpecificType(device.id) === 'windowServo';
  const isValve = getDeviceSpecificType(device.id) === 'gasValve';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.deviceCard}>
      <View style={styles.deviceCardTop}>
        <View>
          <Text style={styles.deviceTitle}>{device.name}</Text>
          <Text style={styles.deviceSubtitle}>{device.room}</Text>
        </View>
        <StatusBadge status={device.status} />
      </View>

      {device.type === 'sensor' ? (
        <View>
          {getDeviceSpecificType(device.id) === 'gasSensor' && (
            <>
              <InfoRow label="Gas detected" value={String(device.lastTelemetry?.gasDetected ?? false)} />
              <InfoRow label="Raw value" value={`${device.lastTelemetry?.rawValue ?? '-'} ppm`} />
            </>
          )}
          {getDeviceSpecificType(device.id) === 'waterLeakSensor' && (
            <>
              <InfoRow label="Leak" value={String(device.lastTelemetry?.waterLeak ?? false)} />
              <InfoRow label="Humidity" value={`${device.lastTelemetry?.humidity ?? '-'}%`} />
            </>
          )}
          {getDeviceSpecificType(device.id) === 'fireSensor' && (
            <>
              <InfoRow label="Smoke detected" value={String(device.lastTelemetry?.smokeDetected ?? false)} />
              <InfoRow label="Temperature" value={`${device.lastTelemetry?.temperature ?? '-'}°C`} />
            </>
          )}
          <Text style={styles.lastSeenText}>Last update: {formatLastSeen(device.lastSeen)}</Text>
        </View>
      ) : (
        <View>
          <InfoRow
            label="Current state"
            value={device.state?.power || device.state?.position || device.state?.valve || 'Unknown'}
          />
          <Text style={styles.lastSeenText}>Last update: {formatLastSeen(device.lastSeen)}</Text>

          <View style={styles.buttonRow}>
            {isFan && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onQuickCommand(device.id, { power: device.state?.power === 'ON' ? 'OFF' : 'ON' })}
              >
                <Text style={styles.primaryButtonText}>Toggle</Text>
              </TouchableOpacity>
            )}

            {isValve && (
              <>
                <TouchableOpacity style={styles.primaryButton} onPress={() => onQuickCommand(device.id, { valve: 'OPEN' })}>
                  <Text style={styles.primaryButtonText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => onQuickCommand(device.id, { valve: 'CLOSED' })}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

            {isWindow && (
              <>
                <TouchableOpacity style={styles.primaryButton} onPress={() => onQuickCommand(device.id, { position: 'OPEN' })}>
                  <Text style={styles.primaryButtonText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => onQuickCommand(device.id, { position: 'CLOSED' })}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  deviceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  deviceSubtitle: {
    color: '#64748B',
    marginTop: 2,
  },
  lastSeenText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
});