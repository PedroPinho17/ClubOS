import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { OrganizationContextService } from './organization-context.service';
import { OrganizationContextGuard } from './guards/organization-context.guard';

@Global()
@Module({
  providers: [
    OrganizationContextService,
    {
      provide: APP_GUARD,
      useClass: OrganizationContextGuard,
    },
  ],
  exports: [OrganizationContextService],
})
export class OrganizationContextModule {}
