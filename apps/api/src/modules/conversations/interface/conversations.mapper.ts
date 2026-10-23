import type { ConversationEntity } from '../domain/conversation.entity';

import type { ConversationDto } from './dto/conversation.dto';

/** Maps the domain entity (which carries full participant role/lastReadAt detail) down to the wire DTO. */
export function toConversationDto(entity: ConversationEntity): ConversationDto {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    avatarUrl: entity.avatarUrl,
    participants: entity.participants.map((p) => p.user),
    lastMessagePreview: entity.lastMessagePreview,
    lastMessageAt: entity.lastMessageAt,
    unreadCount: entity.unreadCount,
    createdAt: entity.createdAt,
  };
}
