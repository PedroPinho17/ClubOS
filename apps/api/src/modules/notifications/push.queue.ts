import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { KEY_PREFIX, PUSH_QUEUE } from "../../redis/redis.constants";
import { redisConnectionOptions } from "../../redis/redis.module";

export interface PushJobData {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
  deviceTokenId: string;
}

@Injectable()
export class PushQueue implements OnModuleDestroy {
  private readonly logger = new Logger(PushQueue.name);
  private queue?: Queue<PushJobData>;

  private getQueue(): Queue<PushJobData> {
    if (!this.queue) {
      this.queue = new Queue<PushJobData>(PUSH_QUEUE, {
        connection: redisConnectionOptions(),
        prefix: `${KEY_PREFIX}:bull`,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 200,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
        },
      });
    }
    return this.queue;
  }

  async enqueueMany(jobs: PushJobData[]): Promise<void> {
    if (jobs.length === 0) return;
    const q = this.getQueue();
    await q.addBulk(
      jobs.map((data) => ({
        name: "send",
        data,
      })),
    );
    this.logger.log(`Enfileirados ${jobs.length} push(es)`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close();
  }
}
