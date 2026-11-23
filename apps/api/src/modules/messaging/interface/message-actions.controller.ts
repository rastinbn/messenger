import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { MessagingService } from "../application/messaging.service";
import { MessageNotFoundError, MessageNotOwnedError } from "../domain/errors";

import { ForwardMessageDto } from "./dto/forward-message.dto";
import { MessageDto } from "./dto/message.dto";
import { ReactToMessageDto } from "./dto/react-to-message.dto";
import { toMessageDto } from "./messages.mapper";

/**
 * Message-scoped actions. Kept separate from MessagesController (which is
 * conversation-scoped) because both of these address a message directly and
 * carry their own permission checks.
 */
@ApiTags("messages")
@ApiBearerAuth()
@Controller({ path: "messages", version: "1" })
export class MessageActionsController {
  constructor(private readonly messagingService: MessagingService) {}

  @Delete(":messageId")
  @ApiOperation({ summary: "Delete one of your own messages (soft delete)" })
  @ApiOkResponse({ type: MessageDto })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("messageId") messageId: string
  ): Promise<MessageDto> {
    try {
      const message = await this.messagingService.deleteMessage({ messageId, userId: user.id });
      return toMessageDto(message);
    } catch (err) {
      if (err instanceof MessageNotFoundError) throw new NotFoundException(err.message);
      if (err instanceof MessageNotOwnedError) throw new ForbiddenException(err.message);
      throw err;
    }
  }

  @Post(":messageId/forward")
  @HttpCode(201)
  @ApiOperation({ summary: "Forward a message into another conversation" })
  @ApiOkResponse({ type: MessageDto })
  async forward(
    @CurrentUser() user: AuthenticatedUser,
    @Param("messageId") messageId: string,
    @Body() dto: ForwardMessageDto
  ): Promise<MessageDto> {
    try {
      const forwarded = await this.messagingService.forwardMessage({
        messageId,
        userId: user.id,
        targetConversationId: dto.conversationId
      });
      return toMessageDto(forwarded);
    } catch (err) {
      if (err instanceof MessageNotFoundError) throw new NotFoundException(err.message);
      throw err;
    }
  }

  @Post(":messageId/reactions")
  @HttpCode(200)
  @ApiOperation({ summary: "React to a message (replaces your previous reaction)" })
  @ApiOkResponse({ type: MessageDto })
  async react(
    @CurrentUser() user: AuthenticatedUser,
    @Param("messageId") messageId: string,
    @Body() dto: ReactToMessageDto
  ): Promise<MessageDto> {
    try {
      const message = await this.messagingService.reactToMessage({
        messageId,
        userId: user.id,
        emoji: dto.emoji
      });
      return toMessageDto(message);
    } catch (err) {
      if (err instanceof MessageNotFoundError) throw new NotFoundException(err.message);
      throw err;
    }
  }

  @Delete(":messageId/reactions")
  @ApiOperation({ summary: "Remove your reaction from a message" })
  @ApiOkResponse({ type: MessageDto })
  async unreact(
    @CurrentUser() user: AuthenticatedUser,
    @Param("messageId") messageId: string
  ): Promise<MessageDto> {
    try {
      const message = await this.messagingService.removeReaction({ messageId, userId: user.id });
      return toMessageDto(message);
    } catch (err) {
      if (err instanceof MessageNotFoundError) throw new NotFoundException(err.message);
      throw err;
    }
  }
}
