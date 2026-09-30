import { Module } from "@nestjs/common";
import { DevicesController } from "./devices.controller";
import { PushQueue } from "./push.queue";
import { PushService } from "./push.service";
import { PushWorker } from "./push.worker";

@Module({
  controllers: [DevicesController],
  providers: [PushService, PushQueue, PushWorker],
  exports: [PushService],
})
export class NotificationsModule {}
