import { ApiProperty } from "@nestjs/swagger";

export class AdminStatsDto {
  @ApiProperty() totalUsers!: number;
  @ApiProperty() newUsersToday!: number;
  @ApiProperty() newUsersThisWeek!: number;
  @ApiProperty() totalConversations!: number;
  @ApiProperty() totalMessages!: number;
  @ApiProperty() messagesToday!: number;
  @ApiProperty() suspendedUsers!: number;
}
