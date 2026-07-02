import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import IORedis, { type Redis, type RedisOptions } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Opcoes de ligacao partilhadas (usadas pelo cliente da app e pelo BullMQ).
 * Passamos opcoes (nao uma instancia) ao BullMQ para ele gerir as suas proprias
 * ligacoes de Queue/Worker com a versao de ioredis que traz embutida.
 */
export function redisConnectionOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: 10_000,
    keepAlive: 30_000,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}

/**
 * Cria a ligacao Redis partilhada da aplicacao.
 *
 * Boas praticas aplicadas:
 * - Multiplexing: uma unica ligacao reutilizada por toda a app (em vez de abrir
 *   uma ligacao por operacao). BullMQ recebe ligacoes dedicadas em separado.
 * - Timeouts explicitos (connectTimeout) e keepAlive para deteter ligacoes mortas.
 * - maxRetriesPerRequest: null exigido pelo BullMQ quando a ligacao e partilhada
 *   com blocking commands; mantemos aqui para consistencia.
 * - enableReadyCheck para so aceitar comandos apos o Redis estar pronto.
 */
export function createRedisConnection(): Redis {
  const client = new IORedis({
    ...redisConnectionOptions(),
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 2_000),
  });

  const logger = new Logger('Redis');
  client.on('connect', () => logger.log('Ligacao Redis estabelecida'));
  client.on('error', (err) => logger.error(`Erro Redis: ${err.message}`));

  return client;
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: createRedisConnection,
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor() {}

  async onApplicationShutdown(): Promise<void> {
    // A ligacao e fechada pelo processo; nada critico a fazer aqui em dev.
  }
}
