import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class ReactToMessageDto {
  @ApiProperty({ example: "👍", maxLength: 16 })
  @IsString()
  @Length(1, 16)
  emoji!: string;
}
