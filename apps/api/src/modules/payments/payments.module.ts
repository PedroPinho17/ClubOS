import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { ReceiptQueue } from "./receipt.queue";
import { ReceiptService } from "./receipt.service";
import { ReceiptWorker } from "./receipt.worker";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, ReceiptService, ReceiptQueue, ReceiptWorker],
  exports: [PaymentsService],
})
export class PaymentsModule {}
