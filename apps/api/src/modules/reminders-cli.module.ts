import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MailModule } from "../core/mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PushService } from "./notifications/push.service";
import { RemindersService } from "./reminders/reminders.service";

/**
 * Contexto minimo para `reminders:run`.
 * Evita AppModule (Auth/Payments/BullMQ) que falhava com UndefinedDependencyException.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, MailModule],
  providers: [
    RemindersService,
    {
      provide: PushService,
      useValue: {
        notifyUser: async () => undefined,
      },
    },
  ],
})
export class RemindersCliModule {}
