import { ApiProperty } from "@nestjs/swagger";

export class AdminConversationDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ["direct", "group"] }) type!: string;
  @ApiProperty({ nullable: true }) name!: string | null;
  @ApiProperty() participantCount!: number;
  @ApiProperty() messageCount!: number;
  @ApiProperty({ nullable: true }) lastMessageAt!: Date | null;
  @ApiProperty() createdAt!: Date;
}

export class AdminConversationListDto {
  @ApiProperty({ type: [AdminConversationDto] }) conversations!: AdminConversationDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
