import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import {
  CurrentUser,
  OrgId,
  RequireModule,
  StaffOnly,
} from "../../common/decorators";
import type { AuthUser } from "../../common/types";
import { ModuleGuard } from "../../common/guards/module.guard";
import { AuditService } from "../../core/audit/audit.service";
import { CreatePaymentDto } from "./dto";
import { ListPaymentsQueryDto } from "../../common/dto/pagination-query.dto";
import { PaymentsService } from "./payments.service";

@Controller("api/payments")
@RequireModule("payments")
@UseGuards(ModuleGuard)
@StaffOnly()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(@OrgId() organizationId: string, @Query() query: ListPaymentsQueryDto) {
    return this.payments.list(organizationId, query);
  }

  @Get(":id")
  findOne(@OrgId() organizationId: string, @Param("id") id: string) {
    return this.payments.findOne(organizationId, id);
  }

  @Get(":id/receipt")
  async receipt(
    @OrgId() organizationId: string,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await this.payments.getReceipt(
      organizationId,
      id,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.end(buffer);
  }

  @Get(":id/receipt/status")
  async receiptStatus(
    @OrgId() organizationId: string,
    @Param("id") id: string,
  ) {
    await this.payments.findOne(organizationId, id); // valida ownership
    return { status: await this.payments.getReceiptStatus(id) };
  }

  @Post()
  async create(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentDto,
  ) {
    const payment = await this.payments.create(organizationId, dto);
    await this.audit.log({
      organizationId,
      userId: user.id,
      action: "payment.created",
      entity: "Payment",
      entityId: payment.id,
    });
    return payment;
  }
}
