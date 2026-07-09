import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import {
  AdminOnly,
  CurrentUser,
  OrgId,
  PortalOnly,
  RequireModule,
} from "../../common/decorators";
import type { AuthUser } from "../../common/types";
import { ModuleGuard } from "../../common/guards/module.guard";
import { GrantPortalAccessDto } from "./dto";
import { PortalService } from "./portal.service";

@Controller("api/portal")
@RequireModule("member-portal")
@UseGuards(ModuleGuard)
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get("organization")
  @PortalOnly()
  organizationBranding(@CurrentUser() user: AuthUser) {
    return this.portal.getOrganizationBranding(user.id);
  }

  @Get("organization/logo")
  @PortalOnly()
  async organizationLogo(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const { buffer, contentType } = await this.portal.getLogoBuffer(user.id);
    res.set({
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    });
    res.send(buffer);
  }

  @Get("me")
  @PortalOnly()
  me(@CurrentUser() user: AuthUser) {
    return this.portal.getMe(user.id);
  }

  @Get("payments/:id/receipt")
  @PortalOnly()
  async receipt(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await this.portal.getReceipt(user.id, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.end(buffer);
  }

  @Post("access/:memberId")
  @AdminOnly()
  grant(
    @OrgId() organizationId: string,
    @Param("memberId") memberId: string,
    @Body() dto: GrantPortalAccessDto,
  ) {
    return this.portal.grantAccess(organizationId, memberId, dto.password);
  }
}
