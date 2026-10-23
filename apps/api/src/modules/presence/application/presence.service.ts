import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../redis/redis.service';

/**
 * Tracks which users have at least one active socket connection, using
 * Redis so presence is correct across multiple API instances (not just
 * in-process), and TTL-based so a hard disconnect (crash, network drop)
 * self-heals without needing an explicit "offline" event.
 */
@Injectable()
export class PresenceService {
  constructor(private readonly redis: RedisService) {}

  async connect(userId: string): Promise<void> {
    await this.redis.markOnline(userId);
  }

  async heartbeat(userId: string): Promise<void> {
    await this.redis.heartbeat(userId);
  }

  async disconnect(userId: string): Promise<void> {
    await this.redis.markOffline(userId);
  }

  async isOnline(userId: string): Promise<boolean> {
    return this.redis.isOnline(userId);
  }
}
