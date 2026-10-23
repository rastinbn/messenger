import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liveness/readiness check — verifies DB and Redis connectivity',
  })
  async check(): Promise<{
    status: 'ok' | 'degraded';
    database: boolean;
    redis: boolean;
  }> {
    const [database, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.redis
        .getClient()
        .ping()
        .then(() => true)
        .catch(() => false),
    ]);
    return { status: database && redis ? 'ok' : 'degraded', database, redis };
  }
}
