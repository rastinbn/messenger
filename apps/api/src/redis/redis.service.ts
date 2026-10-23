import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisClientProvider = {
  provide: REDIS_CLIENT,
  useFactory: (config: ConfigService) => {
    const url = config.getOrThrow<string>('REDIS_URL');
    return new Redis(url, { maxRetriesPerRequest: 3 });
  },
  inject: [ConfigService],
};

/**
 * Thin wrapper around ioredis for presence + pub/sub. Kept as a distinct
 * service (rather than injecting the raw client everywhere) so presence
 * key conventions live in one place.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private presenceKey(userId: string): string {
    return `presence:${userId}`;
  }

  /** TTL-based online marker — expires automatically if a client disconnects without a clean close. */
  async markOnline(userId: string, ttlSeconds = 60): Promise<void> {
    await this.client.set(this.presenceKey(userId), '1', 'EX', ttlSeconds);
  }

  async markOffline(userId: string): Promise<void> {
    await this.client.del(this.presenceKey(userId));
  }

  async isOnline(userId: string): Promise<boolean> {
    const val = await this.client.get(this.presenceKey(userId));
    return val === '1';
  }

  async heartbeat(userId: string, ttlSeconds = 60): Promise<void> {
    await this.client.expire(this.presenceKey(userId), ttlSeconds);
  }
}
