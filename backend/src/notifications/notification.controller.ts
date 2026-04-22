import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationSeverity, NotificationType } from './notification.enum';
import { JwtAuthGuard } from '../auth/jwt.guard';
//import { NotificationType } from './notification.enum';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // Example: userId from JWT auth middleware/guard
  @UseGuards(JwtAuthGuard)
  @Post('push-token')
  async registerPushToken(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
    return this.notificationService.registerPushToken(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyNotifications(@Req() req: any) {
    return this.notificationService.findMyNotifications(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/unread')
  async getUnread(@Req() req: any) {
    return this.notificationService.findUnread(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/:id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
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
    userId: '1234',
    type: NotificationType.ALERT,
    severity: NotificationSeverity.CRITICAL,
    title: 'test push',
    body: 'push works',
    data: {},
  });
}

  @Post('daily-summary/run')
  async runDailySummary() {
    await this.notificationService.sendDailySummaryForAllUsers();
    return { success: true };
  }
}