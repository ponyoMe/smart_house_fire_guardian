export type DeviceStatus = 'normal' | 'detected';

export type DeviceType = 'sensor' | 'actuator';

export type Telemetry = {
  temperature?: number;
  humidity?: number;
  gasDetected?: boolean;
  rawValue?: number;
  waterLeak?: boolean;
  smokeDetected?: boolean;
};

export type DeviceState = {
  power?: 'ON' | 'OFF';
  position?: 'OPEN' | 'CLOSED';
  valve?: 'OPEN' | 'CLOSED';
};

export type Device = {
  id: string;
  name: string;
  room: string;
  type: DeviceType;
  status: DeviceStatus;
  state?: DeviceState;
  lastSeen?: string;
  lastTelemetry?: Telemetry;
};

export type ActivityType = 'alert' | 'system' | 'device';
 export type ActivityEvent = 
 { id: string; type: ActivityType;
   title: string;
    room: string; 
    time: string;
     description: string[]; 
     severity: 'red' | 'orange' | 'blue' | 'green'; };
 export type RootStackParamList = {
   MainTabs: undefined;
    DeviceDetails: { deviceId: string }; };
 export type TabsParamList = { Home: undefined; Activity: undefined; Settings: undefined; };