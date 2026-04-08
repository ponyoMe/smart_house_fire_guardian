import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { UserPushTokenEntity } from './entities/user-push-token.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import {
  NotificationStatus,
} from './notification.enum';
import { FcmPushProvider } from './push.provider';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,

    @InjectRepository(UserPushTokenEntity)
    private readonly pushTokenRepo: Repository<UserPushTokenEntity>,

    private readonly pushProvider: FcmPushProvider,
  ) {}

  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<UserPushTokenEntity> {
    const existing = await this.pushTokenRepo.findOne({
      where: { token: dto.token },
    });

    if (existing) {
      existing.userId = userId;
      existing.platform = dto.platform;
      existing.isActive = true;
      return this.pushTokenRepo.save(existing);
    }

    const token = this.pushTokenRepo.create({
      userId,
      token: dto.token,
      platform: dto.platform,
      isActive: true,
    });

    return this.pushTokenRepo.save(token);
  }

  async deactivatePushToken(token: string): Promise<void> {
    await this.pushTokenRepo.update({ token }, { isActive: false });
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      severity: dto.severity,
      title: dto.title,
      body: dto.body,
      data: dto.data ?? {},
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepo.save(notification);
  }

  async createAndSend(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = await this.createNotification(dto);

    try {
      const activeTokens = await this.pushTokenRepo.find({
        where: {
          userId: dto.userId,
          isActive: true,
        },
      });

      for (const tokenRow of activeTokens) {
        await this.pushProvider.send({
          token: tokenRow.token,
          title: dto.title,
          body: dto.body,
          data: {
            notificationId: notification.id,
            ...dto.data,
          },
        });
      }

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    } catch (error) {
      this.logger.error('Failed to send notification', error);
      notification.status = NotificationStatus.FAILED;
    }

    return this.notificationRepo.save(notification);
  }

  async findMyNotifications(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({
      where: {
        userId,
        readAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.readAt = new Date();

    if (notification.status !== NotificationStatus.FAILED) {
      notification.status = NotificationStatus.READ;
    }

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        readAt: new Date(),
        status: NotificationStatus.READ,
      })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
  }
}