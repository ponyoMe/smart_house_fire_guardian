import { DeviceState } from '../types';

const API_BASE_URL = 'http://192.168.0.193:3000';

export async function getDevices() {
  const response = await fetch(`${API_BASE_URL}/devices`);
  if (!response.ok) throw new Error('Failed to load devices');
  return response.json();
}

export async function getDeviceById(deviceId: string) {
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`);
  if (!response.ok) throw new Error('Failed to load device details');
  return response.json();
}

export async function sendDeviceCommand(deviceId: string, command: Partial<DeviceState>) {
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error('Failed to send command');
  }

  return response.json();
}