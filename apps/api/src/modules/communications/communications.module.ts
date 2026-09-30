import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { CommunicationsController } from "./communications.controller";
import { CommunicationsQueue } from "./communications.queue";
import { CommunicationsService } from "./communications.service";
import { CommunicationsWorker } from "./communications.worker";

@Module({
  imports: [NotificationsModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, CommunicationsQueue, CommunicationsWorker],
})
export class CommunicationsModule {}
