import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth';
import { OrganizationContextModule } from './common/organization-context.module';
import { AuditModule } from './core/audit/audit.module';
import { MailModule } from './core/mail/mail.module';
import { MeModule } from './core/me/me.module';
import { ModulesModule } from './core/modules/modules.module';
import { OrganizationsModule } from './core/organizations/organizations.module';
import { UsersModule } from './core/users/users.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { CardsModule } from './modules/cards/cards.module';
import { PortalModule } from './modules/portal/portal.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipPlansModule } from './modules/membership-plans/membership-plans.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ValidationModule } from './modules/qr-validation/validation.module';
import { HealthModule } from './core/health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Better Auth: regista rotas /api/auth/* e um AuthGuard global
    // (todas as rotas protegidas por omissao; usar @AllowAnonymous p/ publicas).
    AuthModule.forRoot({ auth }),
    OrganizationContextModule,
    HealthModule,
    PrismaModule,
    RedisModule,
    StorageModule,
    MailModule,
    AuditModule,
    // Core
    OrganizationsModule,
    MeModule,
    UsersModule,
    ModulesModule,
    // Modulos base
    MembersModule,
    MembershipPlansModule,
    PaymentsModule,
    CardsModule,
    ValidationModule,
    DashboardModule,
    CommunicationsModule,
    ReportsModule,
    PortalModule,
    RemindersModule,
  ],
})
export class AppModule {}
