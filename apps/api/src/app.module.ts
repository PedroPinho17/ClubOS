import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth';
import { AuditModule } from './core/audit/audit.module';
import { MailModule } from './core/mail/mail.module';
import { ModulesModule } from './core/modules/modules.module';
import { OrganizationsModule } from './core/organizations/organizations.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { CardsModule } from './modules/cards/cards.module';
import { PortalModule } from './modules/portal/portal.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MembersModule } from './modules/members/members.module';
import { MembershipPlansModule } from './modules/membership-plans/membership-plans.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ValidationModule } from './modules/qr-validation/validation.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Better Auth: regista rotas /api/auth/* e um AuthGuard global
    // (todas as rotas protegidas por omissao; usar @AllowAnonymous p/ publicas).
    AuthModule.forRoot({ auth }),
    PrismaModule,
    RedisModule,
    StorageModule,
    MailModule,
    AuditModule,
    // Core
    OrganizationsModule,
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
  ],
})
export class AppModule {}
