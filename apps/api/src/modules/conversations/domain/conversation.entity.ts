import type { ConversationType } from '@messenger/shared-types';
import type { PublicUserEntity } from '../../users/domain/user.entity';

export interface ConversationParticipantEntity {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  lastReadAt: Date | null;
  user: PublicUserEntity;
}

export interface ConversationEntity {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: ConversationParticipantEntity[];
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}
