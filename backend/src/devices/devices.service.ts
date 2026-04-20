import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from './device.entity';
import { DeviceStateEntity } from './device-state.entity';
import { DeviceStatus, DeviceState } from './device.enums';

type TelemetryMsg = {
  deviceId: string;
  type: 'telemetry';
  ts: number;
  data: Record<string, any>;
};

type StatusMsg = {
  deviceId: string;
  type: 'status';
  ts: number;
  requestId?: string;
  data: Record<string, any>;
};

const ACTUATOR_STATE_KEYS = new Set([
  'power', 'position', 'valve', 'fan', 'pump', 'light', 'lock',
]);

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepo: Repository<DeviceEntity>,

    @InjectRepository(DeviceStateEntity)
    private readonly stateRepo: Repository<DeviceStateEntity>,
  ) {}

  async getAllDevices() {
    const devices = await this.deviceRepo.find({
      order: { room: 'ASC', id: 'ASC' },
    });
    const states = await this.stateRepo.find();
    const stateMap = new Map(states.map((s) => [s.deviceId, s]));

    return devices.map((device) => {
      const currentState = stateMap.get(device.id);
      return this.formatDevice(device, currentState);
    });
  }

  async getDeviceById(deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException(`Device not found: ${deviceId}`);

    const currentState = await this.stateRepo.findOne({ where: { deviceId } });
    return this.formatDevice(device, currentState ?? undefined);
  }

  private formatDevice(device: DeviceEntity, currentState?: DeviceStateEntity) {
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      room: device.room,
      description: device.description,
      status: currentState?.status ?? null,
      lastSeen: currentState?.lastSeen ?? null,
      lastTelemetry: currentState?.lastTelemetry ?? null,
      state: currentState?.state ?? null,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  private getMessageDate(ts?: number): Date {
    if (!ts || ts < 1_000_000_000) return new Date();
    return new Date(ts * 1000);
  }

  private getTelemetryStatus(data: Record<string, any>): DeviceStatus {
    const detected =
      data.gasDetected === true ||
      data.gas === 1 ||
      data.leak === true ||
      data.water === 1 ||
      data.fireDetected === true ||
      data.flame === 1;

    return detected ? DeviceStatus.DETECTED : DeviceStatus.NORMAL;
  }

  private mapEventToState(event?: string): Record<string, any> {
    if (!event) return {};

    switch (event.toUpperCase()) {
      case 'POWER_ON':
      case 'ON':
        return { power: 'ON' };

      case 'POWER_OFF':
      case 'OFF':
        return { power: 'OFF' };

      case 'OPEN':
        return { position: 'OPEN' };

      case 'CLOSED':
      case 'CLOSE':
        return { position: 'CLOSED' };

      case 'VALVE_OPEN':
      case 'VALVE_ON':
        return { valve: 'OPEN' };

      case 'VALVE_CLOSE':
      case 'VALVE_CLOSED':
      case 'VALVE_OFF':
        return { valve: 'CLOSED' };

      case 'FAN_ON':
        return { fan: 'ON' };

      case 'FAN_OFF':
        return { fan: 'OFF' };

      case 'PUMP_ON':
        return { pump: 'ON' };

      case 'PUMP_OFF':
        return { pump: 'OFF' };

      case 'BUZZER_OFF':
        return { power: 'OFF' };

      case 'BUZZER_ON':
      case 'BUZZER_ALARM':
        return { power: 'ON' };

      default:
        return {};
    }
  }

  private getStatusFromEventOrData(
    data: Record<string, any>,
    existing?: DeviceStatus,
  ): DeviceStatus {
    const statusValue = typeof data.status === 'string' ? data.status.toUpperCase() : '';
    const detectedEvents = new Set([
      'OVERLOAD',
      'ALERT',
      'FAULT',
      'DETECTED',
      'FIRE_DETECTED',
      'GAS_LEAK',
      'WATER_LEAK',
      'LEAK_DETECTED',
    ]);

    const normalEvents = new Set([
      'HEARTBEAT',
      'ONLINE',
      'POWER_ON',
      'POWER_OFF',
      'OPEN',
      'CLOSED',
      'CLOSE',
      'ON',
      'OFF',
      'FIRE_CLEAR',
      'GAS_OK',
      'WATER_OK',
      'PUMP_ON',
      'PUMP_OFF',
      'BUZZER_ON',
      'BUZZER_OFF',
      'BUZZER_ALARM',
      'VALVE_ON',
      'VALVE_OFF',
      'VALVE_OPEN',
      'VALVE_CLOSED',
      'VALVE_CLOSE',
    ]);

    if (detectedEvents.has(statusValue)) {
      return DeviceStatus.DETECTED;
    }

    if (normalEvents.has(statusValue)) {
      return DeviceStatus.NORMAL;
    }

    return existing ?? DeviceStatus.NORMAL;
  }

  private extractActuatorState(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of ACTUATOR_STATE_KEYS) {
      if (key in data) result[key] = data[key];
    }

    if (typeof data.status === 'string') {
      const s = data.status.toUpperCase();

      if (s === 'OPEN' || s === 'CLOSED') result.position = s;
      if (s === 'ON' || s === 'OFF') result.power = s;
      if (s === 'POWER_ON') result.power = 'ON';
      if (s === 'POWER_OFF') result.power = 'OFF';
    }

    return result;
  }

  async applyTelemetry(msg: TelemetryMsg, room: string) {
    const device = await this.deviceRepo.findOne({ where: { id: msg.deviceId } });
    if (!device) throw new NotFoundException(`Device not found: ${msg.deviceId}`);

    const existingState = await this.stateRepo.findOne({ where: { deviceId: msg.deviceId } });

    const stateToSave = this.stateRepo.create({
      deviceId: msg.deviceId,
      status: this.getTelemetryStatus(msg.data),
      lastSeen: this.getMessageDate(msg.ts),
      lastTelemetry: msg.data,
      state: existingState?.state ?? {},
    });

    await this.stateRepo.save(stateToSave);
    return this.getDeviceById(msg.deviceId);
  }

  async applyStatus(msg: StatusMsg, room: string) {
  const device = await this.deviceRepo.findOne({ where: { id: msg.deviceId } });
  if (!device) throw new NotFoundException(`Device not found: ${msg.deviceId}`);

  const existingState = await this.stateRepo.findOne({ where: { deviceId: msg.deviceId } });

  const statusText =
    typeof msg.data?.status === 'string' ? msg.data.status.toUpperCase() : undefined;

  const mappedEventState = this.mapEventToState(statusText);
  const actuatorDelta = this.extractActuatorState(msg.data);

  const mergedState = {
    ...(existingState?.state ?? {}),
    ...mappedEventState,
    ...actuatorDelta,
    ...(msg.data?.message ? { message: msg.data.message } : {}),
    ...(statusText ? { status: statusText } : {}),
  };

  const stateToSave = this.stateRepo.create({
    deviceId: msg.deviceId,
    status: this.getStatusFromEventOrData(msg.data, existingState?.status),
    lastSeen: this.getMessageDate(msg.ts),
    lastTelemetry: existingState?.lastTelemetry ?? null,
    state: mergedState,
  });

  await this.stateRepo.save(stateToSave);

  // special case: esp32 heartbeat/status should also fan out its stored telemetry
  if (msg.deviceId === 'esp32' && existingState?.lastTelemetry) {
    await this.applyEsp32AggregateTelemetry(existingState.lastTelemetry, msg.ts);
  }

  return this.getDeviceById(msg.deviceId);
}

 async applyEsp32AggregateTelemetry(telemetry: Record<string, any>, ts: number) {
  await this.applyTelemetry(
    {
      deviceId: 'esp32',
      type: 'telemetry',
      ts,
      data: telemetry,
    },
    'living',
  );

  if (telemetry.kitchenTemp !== undefined || telemetry.kitchenHum !== undefined) {
    await this.applyTelemetry(
      {
        deviceId: 'kitchen_dht22',
        type: 'telemetry',
        ts,
        data: {
          ...(telemetry.kitchenTemp !== undefined ? { temperature: telemetry.kitchenTemp } : {}),
          ...(telemetry.kitchenHum !== undefined ? { humidity: telemetry.kitchenHum } : {}),
        },
      },
      'kitchen',
    );
  }

  if (telemetry.bedroomTemp !== undefined || telemetry.bedroomHum !== undefined) {
    await this.applyTelemetry(
      {
        deviceId: 'bedroom_dht22',
        type: 'telemetry',
        ts,
        data: {
          ...(telemetry.bedroomTemp !== undefined ? { temperature: telemetry.bedroomTemp } : {}),
          ...(telemetry.bedroomHum !== undefined ? { humidity: telemetry.bedroomHum } : {}),
        },
      },
      'bedroom',
    );
  }

  if (telemetry.gas !== undefined) {
    await this.applyTelemetry(
      {
        deviceId: 'kitchen_mq2_gas',
        type: 'telemetry',
        ts,
        data: { gas: telemetry.gas },
      },
      'kitchen',
    );
  }

  if (telemetry.flame !== undefined) {
    await this.applyTelemetry(
      {
        deviceId: 'living_flame_sensor',
        type: 'telemetry',
        ts,
        data: { flame: telemetry.flame },
      },
      'living',
    );
  }

  if (telemetry.water !== undefined) {
    await this.applyTelemetry(
      {
        deviceId: 'bathroom_water_leak_sensor',
        type: 'telemetry',
        ts,
        data: { water: telemetry.water },
      },
      'bathroom',
    );
  }

  if (telemetry.current !== undefined) {
    await this.applyTelemetry(
      {
        deviceId: 'tech_acs712',
        type: 'telemetry',
        ts,
        data: { current: telemetry.current },
      },
      'tech',
    );
  }

  if (telemetry.power !== undefined) {
    await this.applyStatus(
      {
        deviceId: 'tech_power_relay',
        type: 'status',
        ts,
        data: {
          status: telemetry.power === 1 ? 'POWER_ON' : 'POWER_OFF',
          message: 'Updated from esp32 aggregate telemetry',
        },
      },
      'tech',
    );
  }

  return this.getAllDevices();
}

  buildCommandPayload(deviceId: string, data: Record<string, any>) {
    return {
      requestId: randomUUID(),
      deviceId,
      type: 'command' as const,
      ts: Math.floor(Date.now() / 1000),
      data,
    };
  }

  async sendCommand(deviceId: string, command: Record<string, any>) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException(`Device not found: ${deviceId}`);

    if (device.type !== 'actuator') {
      throw new BadRequestException('Commands can only be sent to actuators.');
    }

    const existingState = await this.stateRepo.findOne({ where: { deviceId } });

    const stateToSave = this.stateRepo.create({
      deviceId: device.id,
      status: existingState?.status ?? DeviceStatus.NORMAL,
      lastSeen: new Date(),
      lastTelemetry: existingState?.lastTelemetry ?? null,
      state: { ...(existingState?.state ?? {}), ...command },
    });

    await this.stateRepo.save(stateToSave);
    return this.getDeviceById(deviceId);
  }
}