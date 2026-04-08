import { BadRequestException, Body, Controller, Param, Post } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesService } from '../devices/devices.service';

@Controller('devices')
export class DeviceCommandsController {
  constructor(
    private readonly mqttService: MqttService,
    private readonly devicesService: DevicesService,
  ) {}

  @Post(':deviceId/command')
  async sendCommand(@Param('deviceId') deviceId: string, @Body() body: Record<string, any>) {
    const device = await this.devicesService.getDeviceById(deviceId);
    if (!device) return { ok: false, message: 'Device not found' };
    if (device.type !== 'actuator') {
      throw new BadRequestException('Commands allowed only for actuators');
    }

    const payload = this.devicesService.buildCommandPayload(deviceId, body);
    const deviceKey = deviceId.replace(`${device.room}_`, '');
    const topic = `home/${device.room}/${deviceKey}/command`;

    this.mqttService.publish(topic, payload);
    return { ok: true, topic, requestId: payload.requestId, payload };
  }
}