import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { DevicesService } from '../devices/devices.service';

type BaseMsg = {
  deviceId: string;
  type: 'telemetry' | 'status' | 'command';
  ts: number;
  requestId?: string;
  data: Record<string, any>;
};

@Injectable()
export class MqttService implements OnModuleInit {
  private client!: mqtt.MqttClient;

  constructor(private readonly devicesService: DevicesService) {}

  onModuleInit() {
    const url = process.env.MQTT_URL ?? 'mqtt://127.0.0.1:1883';
    this.client = mqtt.connect(url);

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      this.client.subscribe('home/+/+/telemetry');
      this.client.subscribe('home/+/+/status');
    });

//     this.client.on('connect', () => {
//   console.log('MQTT Connected to', this.client.options.host, this.client.options.port);
// });

    this.client.on('message', async (topic, message) => {
      const raw = message.toString();

      //console.log(`RAW topic=${topic}:`, raw);
let parsed: BaseMsg | null = null;
//temporary normalization, will be removed once devices send proper JSON
try {
  parsed = JSON.parse(raw);
} catch {
  try {
    const normalized = raw
      .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_-]*)/g, ':"$1"');

    parsed = JSON.parse(normalized);
    console.log('PARSED after normalization', parsed?.type, parsed?.deviceId);
  } catch {
    console.log(`MQTT non-JSON message from ${topic}: ${raw}`);
    return;
  }
}

      if (!parsed?.deviceId || !parsed.type || !parsed.ts || !parsed.data) {
        console.log(`MQTT invalid payload from ${topic}: ${raw}`);
        return;
      }

      try {
        if (parsed.type === 'telemetry') {
          const updated =await this.devicesService.applyTelemetry(parsed as any);
          console.log(`Telemetry applied: ${updated.id}`);
        } else if (parsed.type === 'status') {
          const updated = await this.devicesService.applyStatus(parsed as any);
          console.log(`Status applied: ${updated.id}`);
        } else {
          console.log(`MQTT command received (ignored) topic=${topic}`);
        }
      } catch (e: any) {
        console.log(`MQTT handling error topic=${topic}: ${e?.message ?? e}`);
      }
    });
  }

  publish(topic: string, payload: any) {
    this.client.publish(topic, JSON.stringify(payload));
  }
}