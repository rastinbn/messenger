import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ConsumeMagicLinkDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
