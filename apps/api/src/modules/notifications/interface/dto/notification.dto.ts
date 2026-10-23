import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['message', 'mention', 'friend_request', 'system'] })
  type!: string;
  @ApiProperty() title!: string;
  @ApiProperty() body!: string;
  @ApiProperty() read!: boolean;
  @ApiProperty({ nullable: true }) relatedConversationId!: string | null;
  @ApiProperty() createdAt!: Date;
}
