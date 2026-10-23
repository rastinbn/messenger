import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ConversationsService } from '../application/conversations.service';
import { ConversationNotFoundError } from '../domain/errors';

import { ConversationDto } from './dto/conversation.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { toConversationDto } from './conversations.mapper';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller({ path: 'conversations', version: '1' })
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List conversations the current user participates in',
  })
  @ApiOkResponse({ type: [ConversationDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConversationDto[]> {
    const conversations = await this.conversationsService.listForUser(user.id);
    return conversations.map(toConversationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single conversation' })
  @ApiOkResponse({ type: ConversationDto })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ConversationDto> {
    try {
      const conversation = await this.conversationsService.getForUser(
        id,
        user.id,
      );
      return toConversationDto(conversation);
    } catch (err) {
      if (err instanceof ConversationNotFoundError)
        throw new NotFoundException(err.message);
      throw err;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create (or reuse, for 1:1 DMs) a conversation' })
  @ApiOkResponse({ type: ConversationDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationDto> {
    const conversation = await this.conversationsService.create(
      user.id,
      dto.participantIds,
      dto.name,
    );
    return toConversationDto(conversation);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a conversation as read up to now' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.conversationsService.markRead(id, user.id);
    return { success: true };
  }
}
