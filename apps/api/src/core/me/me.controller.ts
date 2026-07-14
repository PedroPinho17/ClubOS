import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CurrentUser, NoOrgContext } from "../../common/decorators";
import { ACTIVE_ORG_COOKIE } from "../../common/organization-context.service";
import type { AuthUser } from "../../common/types";
import { SetActiveOrganizationDto } from "./dto";
import { MeService } from "./me.service";

@Controller("api/me")
@NoOrgContext()
export class MeController {
  constructor(private readonly me: MeService) {}

  /** Organizacoes a que o utilizador tem acesso (memberships). */
  @Get("organizations")
  organizations(@CurrentUser() user: AuthUser) {
    return this.me.listOrganizations(user);
  }

  /** Org activa + papel efectivo (alinhado com OrganizationContextGuard). */
  @Get("context")
  context(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.me.getActiveContext(user, req);
  }

  /** Troca a organizacao activa (sessao + cookie). */
  @Post("active-organization")
  async setActiveOrganization(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetActiveOrganizationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = req.session as { token?: string } | undefined;
    const result = await this.me.setActiveOrganization(
      user,
      dto.organizationId,
      session?.token,
    );

    const maxAge = 365 * 24 * 60 * 60;
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `${ACTIVE_ORG_COOKIE}=${dto.organizationId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    );

    req.activeOrganizationId = dto.organizationId;
    return result;
  }

  /** Confirma alteracao de password obrigatoria (primeiro login). */
  @Post("complete-password-change")
  completePasswordChange(@CurrentUser() user: AuthUser) {
    return this.me.completePasswordChange(user.id);
  }
}
