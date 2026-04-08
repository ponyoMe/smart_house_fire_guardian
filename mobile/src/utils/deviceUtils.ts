import { Device, DeviceStatus } from '../types';

export const statusMeta = {
  normal: {
    label: 'Normal',
    color: '#22C55E',
    icon: 'checkmark-circle-outline',
  },
  detected: {
    label: 'Detected',
    color: '#EF4444',
    icon: 'warning-outline',
  },
};

export function formatLastSeen(date?: string | null): string {
  if (!date) return 'Unknown';

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getSafetyState(devices: Device[]) {
  if (devices.some(d => d.status === 'detected')) return { label: 'Critical', color: '#EF4444' };
  // if (devices.some(d => d.status === 'WARNING')) return { label: 'Attention Needed', color: '#F59E0B' };
  // if (devices.some(d => d.status === 'OFFLINE')) return { label: 'Partial Connectivity', color: '#9CA3AF' };
  return { label: 'Safe', color: '#22C55E' };
}

export function getDeviceSpecificType(deviceId: string): string {
  if (deviceId.includes('fan')) return 'fan';
  if (deviceId.includes('gas_valve')) return 'gasValve';
  if (deviceId.includes('window')) return 'windowServo';
  if (deviceId.includes('relay')) return 'relay';
  if (deviceId.includes('pump')) return 'pump';

  if (deviceId.includes('mq2')) return 'gasSensor';
  if (deviceId.includes('flame')) return 'fireSensor';
  if (deviceId.includes('leak')) return 'waterLeakSensor';

  return 'unknown';
}