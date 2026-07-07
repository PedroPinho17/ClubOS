import 'reflect-metadata';
import '../../src/env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module';

export type CreateTestAppOptions = {
  authRateLimitMax?: number;
  validateRateLimitMax?: number;
};

/**
 * Arranca a API Nest tal como em producao (bodyParser off, rate limit, CORS).
 * Usado pelos testes E2E HTTP.
 */
export async function createTestApp(opts: CreateTestAppOptions = {}): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.use(helmet());

  const authMax = opts.authRateLimitMax ?? Number(process.env.RATE_LIMIT_AUTH_PER_MIN ?? 1000);
  const validateMax = opts.validateRateLimitMax ?? Number(process.env.RATE_LIMIT_VALIDATE_PER_MIN ?? 1000);

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 60_000,
      max: authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Demasiados pedidos de autenticacao. Tente novamente em breve.' },
    }),
  );
  app.use(
    '/api/validate',
    rateLimit({
      windowMs: 60_000,
      max: validateMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: 'Demasiados pedidos de validacao. Tente novamente em breve.' },
    }),
  );

  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
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
