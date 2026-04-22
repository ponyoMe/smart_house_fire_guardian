export type DeviceStatus = 'normal' | 'detected';

export type DeviceType = 'sensor' | 'actuator';

export type Telemetry = {
  temperature?: number;
  humidity?: number;
  gas?: number;
  flame?: number;
  water?: number;
  current?: number;

  gasDetected?: boolean;
  rawValue?: number;
  waterLeak?: boolean;
  smokeDetected?: boolean;

  kitchenTemp?: number;
  kitchenHum?: number;
  bedroomTemp?: number;
  bedroomHum?: number;
  power?: number;
};

export type DeviceState = {
  power?: 'ON' | 'OFF';
  position?: 'OPEN' | 'CLOSED';
  valve?: 'OPEN' | 'CLOSED';
  fan?: 'ON' | 'OFF';
  pump?: 'ON' | 'OFF';
  light?: 'ON' | 'OFF';
  lock?: 'LOCKED' | 'UNLOCKED' | string;
  status?: string;
  message?: string;
};


export type Device = {
  id: string;
  name: string;
  room: string;
  type: 'sensor' | 'actuator';
  status: 'normal' | 'detected' | null;
  description?: string | null;
  state?: DeviceState | null;
  lastSeen?: string | null;
  lastTelemetry?: Telemetry | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ActivityType = 'alert' | 'system' | 'device';
export type ActivityEvent = {
  id: string;
  type: ActivityType;
  title: string;
  room: string;
  time: string;
  description: string[];
  severity: 'red' | 'orange' | 'blue' | 'green';
  readAt?: string | null;
};

export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type NotificationType = 'alert' | 'info' | 'system' | 'device' | 'daily_summary';

export type BackendNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt?: string | null;
  readAt?: string | null;
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: string;
};

export type RootStackParamList = {
  MainTabs: undefined;
  DeviceDetails: { deviceId: string };
};

export type TabsParamList = { Home: undefined; Activity: undefined; Settings: undefined };