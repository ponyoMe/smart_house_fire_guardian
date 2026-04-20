import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
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
  const refreshDevices = useCallback(async () => {
    try {
      const data = await getDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to refresh devices', err);
    }
  }, []);

  useEffect(() => {
    void refreshDevices();

    const pollId = setInterval(() => {
      void refreshDevices();
    }, 3000);

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void refreshDevices();
      }
    });

    return () => {
      clearInterval(pollId);
      appStateSubscription.remove();
    };
  }, [refreshDevices]);

  const [events] = useState<ActivityEvent[]>([]);

  const updateDeviceCommand = useCallback(
    async (deviceId: string, command: Partial<DeviceState>) => {
      try {
        // Optimistic update (UI first)
        setDevices(prev =>
          prev.map(device =>
            device.id === deviceId
              ? { ...device, state: { ...device.state, ...command } }
              : device,
          ),
        );

        await sendDeviceCommand(deviceId, command);

        // Always re-sync from source of truth.
        await refreshDevices();
      } catch (error) {
        console.error('Command failed', error);
        // Roll forward with backend snapshot even if command flow fails.
        await refreshDevices();
      }
    },
    [refreshDevices],
  );

  const value = useMemo(
    () => ({ devices, events, updateDeviceCommand }),
    [devices, events, updateDeviceCommand],
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
