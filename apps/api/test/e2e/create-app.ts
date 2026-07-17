import "reflect-metadata";
import "../../src/env";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "../../src/app.module";
import {
  applyApiRateLimits,
  configureTrustProxy,
} from "../../src/common/rate-limit";

export type CreateTestAppOptions = {
  authRateLimitMax?: number;
  validateRateLimitMax?: number;
};

/**
 * Arranca a API Nest tal como em producao (bodyParser off, rate limit, CORS).
 * Usado pelos testes E2E HTTP.
 *
 * Rate limit em memoria (nao Redis) para isolamento entre suites E2E.
 */
export async function createTestApp(
  opts: CreateTestAppOptions = {},
): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  configureTrustProxy(app);
  app.use(helmet());

  applyApiRateLimits(app, {
    authMax:
      opts.authRateLimitMax ??
      Number(process.env.RATE_LIMIT_AUTH_PER_MIN ?? 1000),
    validateMax:
      opts.validateRateLimitMax ??
      Number(process.env.RATE_LIMIT_VALIDATE_PER_MIN ?? 1000),
    store: "memory",
  });

  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-organization-id"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}
