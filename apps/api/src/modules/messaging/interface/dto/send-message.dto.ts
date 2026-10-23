import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class SendMessageDto {
  // No @MinLength here deliberately — an image/file-only message has empty
  // text content. MessagingService.sendMessage enforces "content OR at
  // least one attachment" instead of enforcing it at the DTO level.
  @ApiProperty({ maxLength: 4000, default: "" })
  @IsString()
  @MaxLength(4000)
  content!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  attachmentIds?: string[];

  @ApiPropertyOptional({ description: "Id of the message being quoted" })
  @IsOptional()
  @IsUUID("4")
  replyToId?: string;
}
