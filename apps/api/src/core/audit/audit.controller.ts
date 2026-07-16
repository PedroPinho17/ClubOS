import { Controller, Get, Query } from "@nestjs/common";
import { AdminOnly, OrgId } from "../../common/decorators";
import { ListAuditQueryDto } from "../../common/dto/pagination-query.dto";
import { AuditService } from "./audit.service";

@Controller("api/audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @AdminOnly()
  list(@OrgId() organizationId: string, @Query() query: ListAuditQueryDto) {
    return this.audit.list(organizationId, query.limit ?? 100);
  }
}
