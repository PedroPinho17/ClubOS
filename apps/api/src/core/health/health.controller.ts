import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../../redis/redis.constants";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";

@Controller("api")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly storage: StorageService,
  ) {}

  /** Liveness — processo a responder (load balancer / Coolify). */
  @Get("health")
  @AllowAnonymous()
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  /** Readiness — dependencias criticas (PostgreSQL + Redis + S3). */
  @Get("ready")
  @AllowAnonymous()
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const pong = await this.pingRedis(2_000);
      if (pong !== "PONG") {
        throw new ServiceUnavailableException("Redis indisponivel.");
      }
      try {
        await this.storage.ping(2_500);
      } catch {
        throw new ServiceUnavailableException(
          "S3 indisponivel (verifica S3_ENDPOINT / Garage ou R2).",
        );
      }
      return {
        status: "ready",
        db: "ok",
        redis: "ok",
        s3: "ok",
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      if (e instanceof ServiceUnavailableException) throw e;
      throw new ServiceUnavailableException("Dependencias indisponiveis.");
    }
  }

  private pingRedis(timeoutMs: number): Promise<string> {
    return Promise.race([
      this.redis.ping(),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error("Redis timeout")), timeoutMs);
      }),
    ]);
  }
}
