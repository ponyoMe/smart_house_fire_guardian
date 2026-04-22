import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserPushTokenEntity } from './entities/user-push-token.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { FcmPushProvider } from './push.provider';
//import { FcmPushProvider } from './push.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UserPushTokenEntity]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    FcmPushProvider,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}