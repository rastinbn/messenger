import type { MessageEntity } from '../domain/message.entity';

import type { MessageDto } from './dto/message.dto';

export function toMessageDto(entity: MessageEntity): MessageDto {
  return entity;
}
