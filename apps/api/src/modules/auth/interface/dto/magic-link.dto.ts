import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class RequestMagicLinkDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
