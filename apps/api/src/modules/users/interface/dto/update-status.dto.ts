import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const STATUSES = ['online', 'away', 'offline', 'dnd'] as const;

export class UpdateStatusDto {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: (typeof STATUSES)[number];
}
