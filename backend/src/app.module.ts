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
import * as dotenv from 'dotenv';
dotenv.config(); // This loads the environment variables from .env file
@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    autoLoadEntities: true,
    synchronize: true//in prod set to false and use migrations
  }), ConfigModule.forRoot({ isGlobal: true }), AuthModule, MqttModule, DevicesModule],
  controllers: [AppController, DevicesController],
  providers: [AppService],
})
export class AppModule {}
