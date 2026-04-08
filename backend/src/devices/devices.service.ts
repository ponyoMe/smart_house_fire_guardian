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
    });
  }

  async getDeviceById(deviceId: string) {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device not found: ${deviceId}`);
    }

    const currentState = await this.stateRepo.findOne({
      where: { deviceId },
    });

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
    return ts ? new Date(ts * 1000) : new Date();
  }

  private getTelemetryStatus(data: Record<string, any>): DeviceStatus {
    const detected =
      data.gasDetected === true ||
      data.leak === true ||
      data.fireDetected === true;

    return detected ? DeviceStatus.DETECTED : DeviceStatus.NORMAL;
  }

  private getActuatorState(data: Record<string, any>): DeviceState | null {
  if (data.power === 'ON') return DeviceState.ON;
  if (data.power === 'OFF') return DeviceState.OFF;
  if (data.position === 'OPEN') return DeviceState.OPEN;
  if (data.position === 'CLOSED') return DeviceState.CLOSED;

  return null;
}

  async applyTelemetry(msg: TelemetryMsg) {
    const device = await this.deviceRepo.findOne({
      where: { id: msg.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device not found: ${msg.deviceId}`);
    }

    const existingState = await this.stateRepo.findOne({
      where: { deviceId: msg.deviceId },
    });

    const nextStatus = this.getTelemetryStatus(msg.data);
    const lastSeen = this.getMessageDate(msg.ts);

    const stateToSave = this.stateRepo.create({
      deviceId: msg.deviceId,
      status: nextStatus,
      lastSeen,
      lastTelemetry: msg.data,
      state: existingState?.state ?? {},
    });

    await this.stateRepo.save(stateToSave);

    return this.getDeviceById(msg.deviceId);
  }

  async applyStatus(msg: StatusMsg) {
    const device = await this.deviceRepo.findOne({
      where: { id: msg.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device not found: ${msg.deviceId}`);
    }

    const existingState = await this.stateRepo.findOne({
      where: { deviceId: msg.deviceId },
    });

    const nextState = this.getActuatorState(msg.data);
    const mergedState = {
      ...(existingState?.state ?? {}),
      ...msg.data,
    };


const stateToSave = this.stateRepo.create({
  deviceId: msg.deviceId,
  status: existingState?.status ?? DeviceStatus.NORMAL, // don't touch status
  lastSeen: this.getMessageDate(msg.ts),
  lastTelemetry: existingState?.lastTelemetry ?? null,
  state: mergedState,
});

    await this.stateRepo.save(stateToSave);

    return this.getDeviceById(msg.deviceId);
  }

  buildCommandPayload(deviceId: string, data: Record<string, any>) {
    const requestId = randomUUID();

    return {
      requestId,
      deviceId,
      type: 'command' as const,
      ts: Math.floor(Date.now() / 1000),
      data,
    };
  }

  async sendCommand(deviceId: string, command: Record<string, any>) {
  const device = await this.deviceRepo.findOne({
    where: { id: deviceId },
  });

  if (!device) {
    throw new NotFoundException(`Device not found: ${deviceId}`);
  }

  if (device.type !== 'actuator') {
    throw new BadRequestException('Commands can only be sent to actuators.');
  }

  const existingState = await this.stateRepo.findOne({
    where: { deviceId },
  });

  const updatedState = {
    ...(existingState?.state ?? {}),
    ...command,
  };

  const stateToSave = this.stateRepo.create({
    deviceId: device.id,
    status: existingState?.status ?? DeviceStatus.NORMAL,
    lastSeen: new Date(),
    lastTelemetry: existingState?.lastTelemetry ?? null,
    state: updatedState,
  });

  await this.stateRepo.save(stateToSave);

  return this.getDeviceById(deviceId);
 }
}