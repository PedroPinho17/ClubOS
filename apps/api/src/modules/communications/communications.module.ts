import { Module } from '@nestjs/common';
import { CommunicationsController } from './communications.controller';
import { CommunicationsQueue } from './communications.queue';
import { CommunicationsService } from './communications.service';
import { CommunicationsWorker } from './communications.worker';

@Module({
  controllers: [CommunicationsController],
  providers: [CommunicationsService, CommunicationsQueue, CommunicationsWorker],
})
export class CommunicationsModule {}
