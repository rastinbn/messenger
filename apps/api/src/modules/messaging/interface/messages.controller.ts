import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { MessagingService } from "../application/messaging.service";
import { EmptyMessageError, MessageNotFoundError } from "../domain/errors";

import { MessageDto, MessagePageDto } from "./dto/message.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { toMessageDto } from "./messages.mapper";

@ApiTags("messages")
@ApiBearerAuth()
@Controller({ path: "conversations/:conversationId/messages", version: "1" })
export class MessagesController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  @ApiOperation({ summary: "List messages in a conversation (paginated, oldest-first per page)" })
  @ApiOkResponse({ type: MessagePageDto })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
    @Query("cursor") cursor?: string
  ): Promise<MessagePageDto> {
    const page = await this.messagingService.listMessages(conversationId, user.id, cursor);
    return { messages: page.messages.map(toMessageDto), nextCursor: page.nextCursor };
  }

  @Post()
  @ApiOperation({ summary: "Send a message (optionally replying to another)" })
  @ApiOkResponse({ type: MessageDto })
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: SendMessageDto
  ): Promise<MessageDto> {
    try {
      const message = await this.messagingService.sendMessage({
        conversationId,
        senderId: user.id,
        content: dto.content,
        attachmentIds: dto.attachmentIds,
        replyToId: dto.replyToId
      });
      return toMessageDto(message);
    } catch (err) {
      if (err instanceof EmptyMessageError) throw new BadRequestException(err.message);
      if (err instanceof MessageNotFoundError) throw new NotFoundException(err.message);
      throw err;
    }
  }
}
