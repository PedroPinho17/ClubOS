import 'reflect-metadata';
import './env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser desativado: o Better Auth precisa do corpo cru; a lib
  // @thallesp/nestjs-better-auth volta a adicionar os parsers para as
  // restantes rotas.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(helmet());
  app.enableCors({
    origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ClubOS API a correr em http://localhost:${port}`);
}

void bootstrap();
