import "reflect-metadata";
import "./env";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { SentryExceptionFilter } from "./common/filters/sentry-exception.filter";
import { initSentry } from "./sentry";

async function bootstrap() {
  initSentry();

  // bodyParser desativado: o Better Auth precisa do corpo cru; a lib
  // @thallesp/nestjs-better-auth volta a adicionar os parsers para as
  // restantes rotas.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(helmet());

  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.RATE_LIMIT_AUTH_PER_MIN ?? 15),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Demasiados pedidos de autenticacao. Tente novamente em breve.",
    },
  });
  const validateLimiter = rateLimit({
    windowMs: 60_000,
    max: Number(process.env.RATE_LIMIT_VALIDATE_PER_MIN ?? 60),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Demasiados pedidos de validacao. Tente novamente em breve.",
    },
  });
  app.use("/api/auth", authLimiter);
  app.use("/api/validate", validateLimiter);

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
