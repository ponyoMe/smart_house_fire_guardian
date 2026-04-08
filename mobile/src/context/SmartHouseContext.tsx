import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
//import { INITIAL_DEVICES, INITIAL_EVENTS } from '../data/mockData';
import {  ActivityEvent, Device, DeviceState } from '../types';
import { getDevices, sendDeviceCommand } from '../services/api';

type SmartHouseContextType = {
  devices: Device[];
  events: ActivityEvent[];
  updateDeviceCommand: (deviceId: string, command: Partial<DeviceState>) => Promise<void>;
};

const SmartHouseContext = createContext<SmartHouseContextType | undefined>(undefined);

export function SmartHouseProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
  getDevices()
    .then(setDevices)
    .catch(err => console.error('Failed to load devices', err));
  }, []);

  const [events] = useState<ActivityEvent[]>([]);

  const updateDeviceCommand = async (deviceId: string, command: Partial<DeviceState>) => {
  try {
    // Optimistic update (UI first)
    setDevices(prev =>
      prev.map(device =>
        device.id === deviceId
          ? { ...device, state: { ...device.state, ...command } }
          : device,
      ),
    );

    // Send to backend
    const updatedDevice = await sendDeviceCommand(deviceId, command);

    // Sync with backend response
    setDevices(prev =>
      prev.map(d => (d.id === deviceId ? updatedDevice : d)),
    );

  } catch (error) {
    console.error('Command failed', error);
  }
};

  const value = useMemo(
    () => ({ devices, events, updateDeviceCommand }),
    [devices, events],
  );

  return <SmartHouseContext.Provider value={value}>{children}</SmartHouseContext.Provider>;
}

export function useSmartHouse() {
  const context = useContext(SmartHouseContext);
  if (!context) {
    throw new Error('useSmartHouse must be used inside SmartHouseProvider');
  }
  return context;
}
