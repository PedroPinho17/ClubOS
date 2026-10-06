import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Worker, type Job } from "bullmq";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { PrismaService } from "../../prisma/prisma.service";
import { KEY_PREFIX, PUSH_QUEUE } from "../../redis/redis.constants";
import { redisConnectionOptions } from "../../redis/redis.module";
import type { PushJobData } from "./push.queue";

export interface PushWorkerDeps {
  prisma: Pick<PrismaService, "deviceToken">;
  expo: Pick<
    Expo,
    "sendPushNotificationsAsync" | "getPushNotificationReceiptsAsync"
  >;
  ticketMap: Map<string, string>;
  logger?: Pick<Logger, "warn" | "error">;
  isExpoPushToken?: (token: string) => boolean;
}

/** Logica de envio push (testavel sem BullMQ). */
export async function processPushJob(
  deps: PushWorkerDeps,
  data: PushJobData,
): Promise<void> {
  const { token, title, body, data: payload, deviceTokenId } = data;
  const isToken = deps.isExpoPushToken ?? Expo.isExpoPushToken.bind(Expo);
  if (!isToken(token)) {
    await deps.prisma.deviceToken.update({
      where: { id: deviceTokenId },
      data: { disabledAt: new Date() },
    });
    return;
  }

  const message: ExpoPushMessage = {
    to: token,
    sound: "default",
    title,
    body,
    data: payload,
    channelId: "default",
  };

  const tickets = await deps.expo.sendPushNotificationsAsync([message]);
  for (const ticket of tickets) {
    if (ticket.status === "error") {
      const err = ticket.details?.error;
      if (err === "DeviceNotRegistered") {
        await deps.prisma.deviceToken.update({
          where: { id: deviceTokenId },
          data: { disabledAt: new Date() },
        });
      }
      deps.logger?.warn?.(`Expo ticket error: ${ticket.message}`);
    } else if (ticket.status === "ok" && ticket.id) {
      deps.ticketMap.set(ticket.id, deviceTokenId);
    }
  }
}

/** Leitura de receipts Expo (cron). */
export async function processPushReceipts(deps: PushWorkerDeps): Promise<void> {
  const ids = [...deps.ticketMap.keys()].slice(0, 100);
  if (ids.length === 0) return;

  try {
    const receipts = await deps.expo.getPushNotificationReceiptsAsync(ids);
    for (const [id, receipt] of Object.entries(receipts)) {
      const deviceTokenId = deps.ticketMap.get(id);
      deps.ticketMap.delete(id);
      if (!deviceTokenId) continue;
      if (receipt.status === "error") {
        const err = receipt.details?.error;
        if (err === "DeviceNotRegistered") {
          await deps.prisma.deviceToken.update({
            where: { id: deviceTokenId },
            data: { disabledAt: new Date() },
          });
        }
      }
    }
  } catch (e) {
    deps.logger?.warn?.(`Falha ao ler receipts Expo: ${(e as Error).message}`);
  }
}

@Injectable()
export class PushWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushWorker.name);
  private readonly expo = new Expo();
  private worker?: Worker<PushJobData>;
  private ticketMap = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.worker = new Worker<PushJobData>(
      PUSH_QUEUE,
      (job) => this.process(job),
      {
        connection: redisConnectionOptions(),
        prefix: `${KEY_PREFIX}:bull`,
        concurrency: 5,
      },
    );

    this.worker.on("failed", (job, err) =>
      this.logger.error(`Push falhou (${job?.data.token}): ${err.message}`),
    );
  }

  private async process(job: Job<PushJobData>): Promise<void> {
    await processPushJob(
      {
        prisma: this.prisma,
        expo: this.expo,
        ticketMap: this.ticketMap,
        logger: this.logger,
      },
      job.data,
    );
  }

  @Cron("*/15 * * * *")
  async checkReceipts(): Promise<void> {
    await processPushReceipts({
      prisma: this.prisma,
      expo: this.expo,
      ticketMap: this.ticketMap,
      logger: this.logger,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
