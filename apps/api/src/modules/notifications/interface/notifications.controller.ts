import { Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { NotificationsService } from '../application/notifications.service';

import { NotificationDto } from './dto/notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ type: [NotificationDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationDto[]> {
    return this.notificationsService.listForUser(user.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.notificationsService.markRead(id, user.id);
    return { success: true };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true }> {
    await this.notificationsService.markAllRead(user.id);
    return { success: true };
  }
}
