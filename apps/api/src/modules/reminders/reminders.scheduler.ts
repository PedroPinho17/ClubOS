import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(private readonly reminders: RemindersService) {}

  /** Segunda-feira 09:00 (timezone do servidor). */
  @Cron(process.env.REMINDERS_CRON ?? CronExpression.MONDAY_TO_FRIDAY_AT_9AM)
  async handleCron(): Promise<void> {
    if (process.env.REMINDERS_ENABLED !== 'true') return;

    this.logger.log('A executar lembretes automaticos de quotas...');
    const results = await this.reminders.runForAllOrganizations();
    const sent = results.reduce((a, r) => a + r.sent, 0);
    this.logger.log(`Lembretes concluidos. Total enviados: ${sent}`);
  }
}
