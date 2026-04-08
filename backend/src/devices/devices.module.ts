import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceStateEntity } from './device-state.entity';
import { DeviceEntity } from './device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity, DeviceStateEntity])],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService], //allow other modules (MqttModule) to inject it
})
export class DevicesModule {}