import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  NotificationSeverity,
  NotificationType,
} from '../notification.enum';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationSeverity)
  severity!: NotificationSeverity;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}