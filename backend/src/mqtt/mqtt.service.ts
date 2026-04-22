import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { DevicesService } from '../devices/devices.service';
import { NotificationService } from '../notifications/notification.service';

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
  private readonly lastAlertSentAt = new Map<string, number>();

  constructor(
    private readonly devicesService: DevicesService,
    private readonly notificationService: NotificationService,
  ) {}

  private buildAlertMessage(deviceId: string, room: string, data: Record<string, any>) {
    const roomName = room.charAt(0).toUpperCase() + room.slice(1);
    const normalizedId = deviceId.toLowerCase();

    if (data.gasDetected === true || data.gas === 1) {
      return {
        title: 'Gas leak detected',
        body: `Gas sensor triggered in ${roomName}. Please check immediately.`,
        event: 'gas_detected',
      };
    }

    if (data.leak === true || data.waterLeak === true || data.water === 1) {
      return {
        title: 'Water leak detected',
        body: `Water leak sensor triggered in ${roomName}.`,
        event: 'water_leak_detected',
      };
    }

    if (data.fireDetected === true || data.flame === 1) {
      return {
        title: 'Fire risk detected',
        body: `Flame/fire sensor triggered in ${roomName}.`,
        event: 'fire_detected',
      };
    }

    if (normalizedId.includes('gas')) {
      return {
        title: 'Gas risk detected',
        body: `Potential gas event reported by ${deviceId} in ${roomName}.`,
        event: 'gas_detected',
      };
    }

    if (normalizedId.includes('water') || normalizedId.includes('leak')) {
      return {
        title: 'Water leak risk detected',
        body: `Potential leak event reported by ${deviceId} in ${roomName}.`,
        event: 'water_leak_detected',
      };
    }

    if (normalizedId.includes('flame') || normalizedId.includes('fire')) {
      return {
        title: 'Fire risk detected',
        body: `Potential fire event reported by ${deviceId} in ${roomName}.`,
        event: 'fire_detected',
      };
    }

    return {
      title: 'Safety alert detected',
      body: `Device ${deviceId} reported a safety event in ${roomName}.`,
      event: 'generic_alert',
    };
  }

  private isExplicitAlertEvent(data: Record<string, any>): boolean {
    const statusValue = typeof data?.status === 'string' ? data.status.toUpperCase() : '';
    const detectedEvents = new Set([
      'OVERLOAD',
      'ALERT',
      'FAULT',
      'DETECTED',
      'FIRE_DETECTED',
      'GAS_LEAK',
      'WATER_LEAK',
      'LEAK_DETECTED',
      'BUZZER_ALARM',
    ]);

    return (
      detectedEvents.has(statusValue) ||
      data?.gasDetected === true ||
      data?.gas === 1 ||
      data?.leak === true ||
      data?.waterLeak === true ||
      data?.water === 1 ||
      data?.fireDetected === true ||
      data?.flame === 1
    );
  }

  private shouldSendAlertNow(deviceId: string, event: string): boolean {
    const key = `${deviceId}:${event}`;
    const now = Date.now();
    const lastTs = this.lastAlertSentAt.get(key) ?? 0;
    const cooldownMs = 60_000;
    if (now - lastTs < cooldownMs) {
      return false;
    }
    this.lastAlertSentAt.set(key, now);
    return true;
  }

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
      let parsed: Partial<BaseMsg> | null = null;

      try {
        parsed = JSON.parse(raw);
      } catch {
        console.log(`MQTT non-JSON message from ${topic}: ${raw}`);
        return;
      }

      const rawType = typeof parsed?.type === 'string' ? parsed.type.toLowerCase() : '';
      const inferredType = topic.split('/').pop()?.toLowerCase() ?? '';
      const type = (rawType || inferredType) as BaseMsg['type'];

      const rawTs =
        typeof parsed?.ts === 'number'
          ? parsed.ts
          : typeof (parsed as any)?.ts === 'string'
            ? Number((parsed as any).ts)
            : typeof (parsed as any)?.timestamp === 'number'
              ? (parsed as any).timestamp
              : typeof (parsed as any)?.timestamp === 'string'
                ? Number((parsed as any).timestamp)
                : NaN;
      const tsFromPayload = Number.isFinite(rawTs) ? rawTs : Math.floor(Date.now() / 1000);
      const normalizedTs = tsFromPayload > 1_000_000_000_000 ? Math.floor(tsFromPayload / 1000) : tsFromPayload;

      const normalizedPayload: BaseMsg = {
        ...(parsed as BaseMsg),
        deviceId: String(parsed?.deviceId ?? ''),
        type,
        ts: normalizedTs,
      };

      if (!normalizedPayload.deviceId || !normalizedPayload.type || !normalizedPayload.ts) {
        console.log(`MQTT invalid payload from ${topic}: ${raw}`);
        return;
      }

      const normalized = this.normalizeIncomingMessage(normalizedPayload);

      try {
        if (normalized.type === 'telemetry') {
  if (normalized.deviceId === 'esp32') {
    const before = await this.devicesService.getDeviceById(normalized.deviceId);
    const room = before.room;

    console.log(
      `ESP32 aggregate telemetry received from ${topic}:`,
      normalized.data,
    );

    await this.devicesService.applyEsp32AggregateTelemetry(
      normalized.data ?? {},
      normalized.ts,
    );
    const updated = await this.devicesService.getDeviceById(normalized.deviceId);

    const isExplicitAlert = this.isExplicitAlertEvent(normalized.data ?? {});
    if ((before.status !== 'detected' && updated.status === 'detected') || isExplicitAlert) {
      const alert = this.buildAlertMessage(normalized.deviceId, room, normalized.data ?? {});
      if (this.shouldSendAlertNow(normalized.deviceId, alert.event)) {
        await this.notificationService.notifyDeviceAlertForAllUsers({
          deviceId: normalized.deviceId,
          room,
          title: alert.title,
          body: alert.body,
          event: alert.event,
        });
      }
    } else if (before.status === 'detected' && updated.status !== 'detected') {
      await this.notificationService.notifyDeviceInfoForAllUsers({
        deviceId: normalized.deviceId,
        room,
        title: 'Safety status back to normal',
        body: `${normalized.deviceId} in ${room} returned to normal state.`,
        event: 'resolved',
      });
    }

    console.log('ESP32 aggregate telemetry applied successfully:', updated);
    return;
  }

  const device = await this.devicesService.getDeviceById(normalized.deviceId);
  const before = device;
  const room = device.room;

  console.log(
    `Telemetry received for device ${normalized.deviceId} in room ${room}:`,
    normalized.data,
  );

  const updated = await this.devicesService.applyTelemetry(
    normalized as any,
    room,
  );

  const isExplicitAlert = this.isExplicitAlertEvent(normalized.data ?? {});
  if ((before.status !== 'detected' && updated.status === 'detected') || isExplicitAlert) {
    const alert = this.buildAlertMessage(normalized.deviceId, room, normalized.data ?? {});
    if (this.shouldSendAlertNow(normalized.deviceId, alert.event)) {
      await this.notificationService.notifyDeviceAlertForAllUsers({
        deviceId: normalized.deviceId,
        room,
        title: alert.title,
        body: alert.body,
        event: alert.event,
      });
    }
  } else if (before.status === 'detected' && updated.status !== 'detected') {
    await this.notificationService.notifyDeviceInfoForAllUsers({
      deviceId: normalized.deviceId,
      room,
      title: 'Safety status back to normal',
      body: `${normalized.deviceId} in ${room} returned to normal state.`,
      event: 'resolved',
    });
  }

  console.log(
    `Telemetry applied for device ${normalized.deviceId} in room ${room}:`,
    updated,
  );

  return;
}

        if (normalized.type === 'status') {
          const device = await this.devicesService.getDeviceById(normalized.deviceId);
          const before = device;
          const room = device.room;

          console.log(
            `Status received for device ${normalized.deviceId} in room ${room}:`,
            normalized.data,
          );

          const updated = await this.devicesService.applyStatus(
            normalized as any,
            room,
          );

          const isExplicitAlert = this.isExplicitAlertEvent(normalized.data ?? {});
          if ((before.status !== 'detected' && updated.status === 'detected') || isExplicitAlert) {
            const alert = this.buildAlertMessage(normalized.deviceId, room, normalized.data ?? {});
            if (this.shouldSendAlertNow(normalized.deviceId, alert.event)) {
              await this.notificationService.notifyDeviceAlertForAllUsers({
                deviceId: normalized.deviceId,
                room,
                title: alert.title,
                body: alert.body,
                event: alert.event,
              });
            }
          } else if (before.status === 'detected' && updated.status !== 'detected') {
            await this.notificationService.notifyDeviceInfoForAllUsers({
              deviceId: normalized.deviceId,
              room,
              title: 'Safety status back to normal',
              body: `${normalized.deviceId} in ${room} returned to normal state.`,
              event: 'resolved',
            });
          }

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