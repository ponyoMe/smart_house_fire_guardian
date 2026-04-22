import { DeviceState } from '../types';

const API_BASE_URL = 'http://192.168.0.6:3000';
let authToken: string | null = null;

function buildAuthHeaders() {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

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

export async function registerPushToken(token: string, platform: 'android' | 'ios') {
  const response = await fetch(`${API_BASE_URL}/notifications/push-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({ token, platform }),
  });

  if (!response.ok) {
    throw new Error('Failed to register push token');
  }

  return response.json();
}

export async function getMyNotifications() {
  const response = await fetch(`${API_BASE_URL}/notifications/me`, {
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}