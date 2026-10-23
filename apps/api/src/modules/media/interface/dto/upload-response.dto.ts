import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['image', 'file'] }) type!: string;
  @ApiProperty() url!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() sizeBytes!: number;
  @ApiProperty({ nullable: true }) width!: number | null;
  @ApiProperty({ nullable: true }) height!: number | null;
}
