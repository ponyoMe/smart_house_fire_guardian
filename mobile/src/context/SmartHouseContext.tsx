import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
//import { INITIAL_DEVICES, INITIAL_EVENTS } from '../data/mockData';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { ActivityEvent, BackendNotification, Device, DeviceState } from '../types';
import {
  getAuthToken,
  getDevices,
  getMyNotifications,
  registerPushToken,
  sendDeviceCommand,
} from '../services/api';

type SmartHouseContextType = {
  devices: Device[];
  events: ActivityEvent[];
  updateDeviceCommand: (deviceId: string, command: Partial<DeviceState>) => Promise<void>;
  initializeNotifications: () => Promise<void>;
  refreshAppData: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
};

const SmartHouseContext = createContext<SmartHouseContextType | undefined>(undefined);

export function SmartHouseProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [pushRegistered, setPushRegistered] = useState(false);
  const normalizeStatus = useCallback((status: Device['status'] | string | null | undefined): Device['status'] => {
    if (!status) return null;
    const normalized = String(status).trim().toLowerCase();
    if (normalized === 'detected') return 'detected';
    if (normalized === 'normal') return 'normal';
    return null;
  }, []);

  const normalizeDevices = useCallback(
    (list: Device[]): Device[] =>
      list.map(device => ({
        ...device,
        status: normalizeStatus(device.status),
      })),
    [normalizeStatus],
  );

  const refreshDevices = useCallback(async () => {
    try {
      const data = await getDevices();
      setDevices(normalizeDevices(data));
    } catch (err) {
      console.error('Failed to refresh devices', err);
    }
  }, [normalizeDevices]);

  useEffect(() => {
    refreshDevices().catch(err => {
      console.error('Initial device refresh failed', err);
    });

    const pollId = setInterval(() => {
      refreshDevices().catch(err => {
        console.error('Polling devices failed', err);
      });
    }, 3000);

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshDevices().catch(err => {
          console.error('Active state device refresh failed', err);
        });
      }
    });

    return () => {
      clearInterval(pollId);
      appStateSubscription.remove();
    };
  }, [refreshDevices]);

  const mapNotificationToActivityEvent = useCallback((item: BackendNotification): ActivityEvent => {
    const room = typeof item.data?.room === 'string' ? item.data.room : 'System';
    const severityMap: Record<BackendNotification['severity'], ActivityEvent['severity']> = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      critical: 'red',
    };

    const rawType = item.type === 'daily_summary' ? 'system' : item.type;
    const type: ActivityEvent['type'] =
      rawType === 'alert' ? 'alert' : rawType === 'system' ? 'system' : 'device';

    return {
      id: item.id,
      type,
      title: item.title,
      room,
      time: new Date(item.createdAt).toLocaleString(),
      description: [item.body],
      severity: severityMap[item.severity] ?? 'blue',
      readAt: item.readAt ?? null,
    };
  }, []);

  const refreshEvents = useCallback(async () => {
    try {
      const notifications: BackendNotification[] = await getMyNotifications();
      setEvents(notifications.map(mapNotificationToActivityEvent));
    } catch (error) {
      console.error('Failed to refresh notifications', error);
    }
  }, [mapNotificationToActivityEvent]);

  const refreshAppData = useCallback(async () => {
    await Promise.all([refreshDevices(), refreshEvents()]);
  }, [refreshDevices, refreshEvents]);

  const initializeNotifications = useCallback(async () => {
    if (!getAuthToken()) {
      return;
    }

    try {
      if (!pushRegistered) {
          if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            );
          }

        await messaging().requestPermission();
          await messaging().registerDeviceForRemoteMessages();
          await notifee.requestPermission();
        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'alerts',
            name: 'Alerts',
            sound: 'default',
            importance: AndroidImportance.HIGH,
          });
        }

        const fcmToken = await messaging().getToken();
        await registerPushToken(fcmToken, Platform.OS === 'ios' ? 'ios' : 'android');
        setPushRegistered(true);
      }
    } catch (error) {
      console.error('Push setup failed', error);
    }

    await refreshEvents();
  }, [pushRegistered, refreshEvents]);

  useEffect(() => {
    initializeNotifications().catch(err => {
      console.error('Notification init failed', err);
    });

    const fgUnsubscribe = messaging().onMessage(async () => {
      await Promise.all([refreshDevices(), refreshEvents()]);
    });

    const openUnsubscribe = messaging().onNotificationOpenedApp(async () => {
      await Promise.all([refreshDevices(), refreshEvents()]);
    });

    messaging()
      .getInitialNotification()
      .then(async initialMessage => {
        if (initialMessage) {
          await Promise.all([refreshDevices(), refreshEvents()]);
        }
      })
      .catch(err => {
        console.error('Initial notification handling failed', err);
      });

    const pollId = setInterval(() => {
      refreshEvents().catch(err => {
        console.error('Polling notifications failed', err);
      });
    }, 5000);
    return () => {
      fgUnsubscribe();
      openUnsubscribe();
      clearInterval(pollId);
    };
  }, [initializeNotifications, refreshDevices, refreshEvents]);

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
    () => ({
      devices,
      events,
      updateDeviceCommand,
      initializeNotifications,
      refreshAppData,
      refreshNotifications: refreshEvents,
    }),
    [devices, events, updateDeviceCommand, initializeNotifications, refreshAppData, refreshEvents],
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
