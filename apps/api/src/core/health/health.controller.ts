import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** Liveness — processo a responder (load balancer / Coolify). */
  @Get('health')
  @AllowAnonymous()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Readiness — dependencias criticas (PostgreSQL + Redis). */
  @Get('ready')
  @AllowAnonymous()
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const pong = await this.pingRedis(2_000);
      if (pong !== 'PONG') {
        throw new ServiceUnavailableException('Redis indisponivel.');
      }
      return { status: 'ready', db: 'ok', redis: 'ok', timestamp: new Date().toISOString() };
    } catch (e) {
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException('Dependencias indisponiveis.');
    }
  }

  private pingRedis(timeoutMs: number): Promise<string> {
    return Promise.race([
      this.redis.ping(),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Redis timeout')), timeoutMs);
      }),
    ]);
  }
}
