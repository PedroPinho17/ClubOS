import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { OrgId } from '../../common/decorators';
import { AuditService } from './audit.service';

@Controller('api/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(['imperador', 'administrador'])
  list(@OrgId() organizationId: string, @Query('limit') limit?: string) {
    const n = limit ? Number.parseInt(limit, 10) : 100;
    return this.audit.list(organizationId, Number.isFinite(n) ? n : 100);
  }
}
