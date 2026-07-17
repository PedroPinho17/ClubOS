import "reflect-metadata";
import "./env";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Redis } from "ioredis";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { SentryExceptionFilter } from "./common/filters/sentry-exception.filter";
import { applyApiRateLimits, configureTrustProxy } from "./common/rate-limit";
import { REDIS_CLIENT } from "./redis/redis.constants";
import { initSentry } from "./sentry";

async function bootstrap() {
  initSentry();

  // bodyParser desativado: o Better Auth precisa do corpo cru; a lib
  // @thallesp/nestjs-better-auth volta a adicionar os parsers para as
  // restantes rotas.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  configureTrustProxy(app);
  app.use(helmet());

  let redis: Redis | null = null;
  try {
    const client = app.get<Redis>(REDIS_CLIENT);
    await client.ping();
    redis = client;
  } catch {
    redis = null;
  }

  // Producao: Redis partilha contadores entre replicas. Fallback memoria se Redis falhar.
  applyApiRateLimits(app, {
    redis,
    store: process.env.RATE_LIMIT_STORE === "memory" ? "memory" : "redis",
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

  if (process.env.SENTRY_DSN?.trim()) {
    app.useGlobalFilters(new SentryExceptionFilter());
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle("ClubOS API")
    .setDescription("API REST do ClubOS — gestao multi-tenant de organizacoes.")
    .setVersion("1.0")
    .addCookieAuth("better-auth.session_token")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`ClubOS API a correr em http://localhost:${port}`);
  console.log(`Documentacao OpenAPI: http://localhost:${port}/api/docs`);
}

void bootstrap();
