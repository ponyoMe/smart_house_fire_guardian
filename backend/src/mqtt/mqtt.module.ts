import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesModule } from '../devices/devices.module';
import { DeviceCommandsController } from './mqtt.controller';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [DevicesModule, NotificationModule],
    controllers: [DeviceCommandsController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}