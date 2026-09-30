import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { RemindersController } from "./reminders.controller";
import { RemindersScheduler } from "./reminders.scheduler";
import { RemindersService } from "./reminders.service";

@Module({
  imports: [NotificationsModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersScheduler],
  exports: [RemindersService],
})
export class RemindersModule {}
