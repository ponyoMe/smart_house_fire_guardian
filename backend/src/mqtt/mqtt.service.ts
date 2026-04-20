import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { DevicesService } from '../devices/devices.service';

type BaseMsg = {
  deviceId: string;
  type: 'telemetry' | 'status' | 'command' | 'alert';
  ts: number;
  requestId?: string;
  data?: Record<string, any>;
  event?: string;
  message?: string;
};

@Injectable()
export class MqttService implements OnModuleInit {
  private client!: mqtt.MqttClient;

  constructor(private readonly devicesService: DevicesService) {}

  onModuleInit() {
    const url =
      process.env.MQTT_URL ??
      'mqtts://a4af6d33f79a4077860f7a5fed91b077.s1.eu.hivemq.cloud:8883';

    const options = {
      username: 'iot_smart_home',
      password: 'Password1',
    };

    this.client = mqtt.connect(url, options);

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      this.client.subscribe('home/+/+/telemetry');
      this.client.subscribe('home/+/+/status');
      this.client.subscribe('home/+/+/alert');
    });

    this.client.on('message', async (topic, message) => {
      const raw = message.toString();
      let parsed: BaseMsg | null = null;

      try {
        parsed = JSON.parse(raw);
      } catch {
        console.log(`MQTT non-JSON message from ${topic}: ${raw}`);
        return;
      }

      if (!parsed?.deviceId || !parsed.type || !parsed.ts) {
        console.log(`MQTT invalid payload from ${topic}: ${raw}`);
        return;
      }

      const normalized = this.normalizeIncomingMessage(parsed);

      try {
        if (normalized.type === 'telemetry') {
  if (normalized.deviceId === 'esp32') {
    console.log(
      `ESP32 aggregate telemetry received from ${topic}:`,
      normalized.data,
    );

    const updated = await this.devicesService.applyEsp32AggregateTelemetry(
      normalized.data ?? {},
      normalized.ts,
    );

    console.log('ESP32 aggregate telemetry applied successfully:', updated);
    return;
  }

  const device = await this.devicesService.getDeviceById(normalized.deviceId);
  const room = device.room;

  console.log(
    `Telemetry received for device ${normalized.deviceId} in room ${room}:`,
    normalized.data,
  );

  const updated = await this.devicesService.applyTelemetry(
    normalized as any,
    room,
  );

  console.log(
    `Telemetry applied for device ${normalized.deviceId} in room ${room}:`,
    updated,
  );

  return;
}

        if (normalized.type === 'status') {
          const device = await this.devicesService.getDeviceById(normalized.deviceId);
          const room = device.room;

          console.log(
            `Status received for device ${normalized.deviceId} in room ${room}:`,
            normalized.data,
          );

          const updated = await this.devicesService.applyStatus(
            normalized as any,
            room,
          );

          console.log(
            `Status applied for device ${normalized.deviceId} in room ${room}:`,
            updated,
          );

          return;
        }
      } catch (e: any) {
        console.log(
          `Error while processing MQTT message for device ${normalized.deviceId}: ${e?.message ?? e}`,
        );
      }
    });
  }

  private normalizeIncomingMessage(msg: BaseMsg): BaseMsg {
    if (msg.type === 'telemetry') {
      return {
        ...msg,
        data: msg.data ?? {},
      };
    }

    if (msg.type === 'status' || msg.type === 'alert') {
      const normalizedData: Record<string, any> = {
        ...(msg.data ?? {}),
      };

      if (msg.event && !normalizedData.status) {
        normalizedData.status = msg.event;
      }

      if (msg.message && !normalizedData.message) {
        normalizedData.message = msg.message;
      }

      return {
        ...msg,
        type: 'status',
        data: normalizedData,
      };
    }

    return {
      ...msg,
      data: msg.data ?? {},
    };
  }

  publish(topic: string, payload: any) {
    this.client.publish(topic, JSON.stringify(payload));
  }
}