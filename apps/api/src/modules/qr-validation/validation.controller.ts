import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import {
  CurrentUser,
  OrgId,
  RequireModule,
  StaffOnly,
} from "../../common/decorators";
import type { AuthUser } from "../../common/types";
import { ModuleGuard } from "../../common/guards/module.guard";
import { UseGuards } from "@nestjs/common";
import { verifyValidationSignature } from "../../common/qr-signature";
import { ScanQrDto } from "./dto";
import { ValidationService } from "./validation.service";

@Controller()
export class ValidationController {
  constructor(private readonly validation: ValidationService) {}

  /** Endpoint publico: lido pela pagina /validar (destino do QR do cartao). */
  @Get("api/validate/:memberId")
  @AllowAnonymous()
  validate(
    @Param("memberId") memberId: string,
    @Query("expires") expiresStr?: string,
    @Query("sig") sig?: string,
  ) {
    const expires = expiresStr ? Number.parseInt(expiresStr, 10) : Number.NaN;
    if (
      !sig ||
      !Number.isFinite(expires) ||
      !verifyValidationSignature(memberId, expires, sig)
    ) {
      throw new UnauthorizedException(
        "Link de validacao invalido ou expirado.",
      );
    }
    return this.validation.validate(memberId);
  }

  /** Leitura autenticada no balcao (app mobile staff). */
  @Post("api/validation/scan")
  @StaffOnly()
  @RequireModule("qr-validation")
  @UseGuards(ModuleGuard)
  scan(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ScanQrDto,
    @Req() req: Request,
  ) {
    return this.validation.scanForStaff(
      organizationId,
      user.id,
      dto.payload,
      req.ip,
    );
  }
}
