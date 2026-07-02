import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ReceiptQueue } from './receipt.queue';
import { ReceiptService } from './receipt.service';
import { ReceiptWorker } from './receipt.worker';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, ReceiptService, ReceiptQueue, ReceiptWorker],
  exports: [PaymentsService],
})
export class PaymentsModule {}
