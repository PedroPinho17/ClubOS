import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { OrganizationContextService } from "./organization-context.service";
import { EffectiveRoleGuard } from "./guards/effective-role.guard";
import { OrganizationContextGuard } from "./guards/organization-context.guard";

@Global()
@Module({
  providers: [
    OrganizationContextService,
    {
      provide: APP_GUARD,
      useClass: OrganizationContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EffectiveRoleGuard,
    },
  ],
  exports: [OrganizationContextService],
})
export class OrganizationContextModule {}
