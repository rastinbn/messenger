import { ApiProperty } from '@nestjs/swagger';

import { PublicUserDto } from '../../../users/interface/dto/public-user.dto';

export class ConversationDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['direct', 'group'] }) type!: string;
  @ApiProperty({ nullable: true }) name!: string | null;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ type: [PublicUserDto] }) participants!: PublicUserDto[];
  @ApiProperty({ nullable: true }) lastMessagePreview!: string | null;
  @ApiProperty({ nullable: true }) lastMessageAt!: Date | null;
  @ApiProperty() unreadCount!: number;
  @ApiProperty() createdAt!: Date;
}
