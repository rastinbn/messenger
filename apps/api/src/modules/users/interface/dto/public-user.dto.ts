import { ApiProperty } from "@nestjs/swagger";

export class PublicUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() username!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true }) avatarUrl!: string | null;
  @ApiProperty({ enum: ["online", "away", "offline", "dnd"] }) status!: string;
  @ApiProperty({ nullable: true }) statusMessage!: string | null;
}

export class UserDto extends PublicUserDto {
  @ApiProperty() email!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ nullable: true }) emailVerifiedAt!: Date | null;
  @ApiProperty({ enum: ["user", "admin"] }) siteRole!: string;
}
