import { ApiProperty } from "@nestjs/swagger";

export class AdminUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() username!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ["online", "away", "offline", "dnd"] }) status!: string;
  @ApiProperty({ enum: ["user", "admin"] }) siteRole!: string;
  @ApiProperty({ nullable: true }) emailVerifiedAt!: Date | null;
  @ApiProperty({ nullable: true }) suspendedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
}

export class AdminUserListDto {
  @ApiProperty({ type: [AdminUserDto] }) users!: AdminUserDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}
