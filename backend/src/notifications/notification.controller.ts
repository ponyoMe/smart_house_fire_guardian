import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationSeverity, NotificationType } from './notification.enum';
//import { NotificationType } from './notification.enum';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Example: userId from JWT auth middleware/guard
  @Post('push-token')
  async registerPushToken(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
    return this.notificationService.registerPushToken(req.user.id, dto);
  }

  @Get('me')
  async getMyNotifications(@Req() req: any) {
    return this.notificationService.findMyNotifications(req.user.id);
  }

  @Get('me/unread')
  async getUnread(@Req() req: any) {
    return this.notificationService.findUnread(req.user.id);
  }

  @Patch('me/:id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Patch('me/read-all')
  async markAllAsRead(@Req() req: any) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  // Internal/system route, ideally protected for admin/services only
  @Post()
  async createAndSend(@Body() dto: CreateNotificationDto) {
    return this.notificationService.createAndSend(dto);
  }

  @Post('test-push')
async testPush() {
  return this.notificationService.createAndSend({
    userId: 'test-user',
    type: NotificationType.ALERT,
    severity: NotificationSeverity.CRITICAL,
    title: 'test push',
    body: 'push works',
    data: {},
  });
}
}