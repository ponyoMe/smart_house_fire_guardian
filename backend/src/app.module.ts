import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DevicesController } from './devices/devices.controller';
import { DevicesService } from './devices/devices.service';
import { MqttModule } from './mqtt/mqtt.module';
import { ConfigModule } from '@nestjs/config';
import { MqttService } from './mqtt/mqtt.service';
import { DevicesModule } from './devices/devices.module';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { NotificationModule } from './notifications/notification.module';
import * as dotenv from 'dotenv'; 
@Module({
  imports: [TypeOrmModule.forRoot({
     type: 'postgres',
     url: process.env.DB_URL,
     autoLoadEntities: true,
     synchronize: true,
     ssl: {
       rejectUnauthorized: false,
    },
  }), ConfigModule.forRoot({ isGlobal: true }), AuthModule, MqttModule, DevicesModule, NotificationModule],
  controllers: [AppController, DevicesController],
  providers: [AppService],
})
export class AppModule {}
