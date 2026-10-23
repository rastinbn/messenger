import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ForwardMessageDto {
  @ApiProperty({ description: "Conversation the message is being forwarded into" })
  @IsUUID("4")
  conversationId!: string;
}
