import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['image', 'file'] }) type!: string;
  @ApiProperty() url!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() sizeBytes!: number;
  @ApiProperty({ nullable: true }) width!: number | null;
  @ApiProperty({ nullable: true }) height!: number | null;
}

export class MessageReplyPreviewDto {
  @ApiProperty() id!: string;
  @ApiProperty() senderId!: string;
  @ApiProperty() senderName!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ nullable: true }) deletedAt!: Date | null;
}

export class MessageDto {
  @ApiProperty() id!: string;
  @ApiProperty() conversationId!: string;
  @ApiProperty() senderId!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ enum: ['sending', 'sent', 'delivered', 'read', 'failed'] })
  status!: string;
  @ApiProperty({ nullable: true }) editedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ type: [AttachmentDto] }) attachments!: AttachmentDto[];
  @ApiProperty({ type: MessageReplyPreviewDto, nullable: true })
  replyTo!: MessageReplyPreviewDto | null;
  @ApiProperty() forwarded!: boolean;
  @ApiProperty({ nullable: true }) deletedAt!: Date | null;
}

export class MessagePageDto {
  @ApiProperty({ type: [MessageDto] }) messages!: MessageDto[];
  @ApiProperty({ nullable: true }) nextCursor!: string | null;
}
