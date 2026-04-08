import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { DevicesModule } from '../devices/devices.module';
import { DeviceCommandsController } from './mqtt.controller';

@Module({
    imports: [DevicesModule],
    controllers: [DeviceCommandsController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}