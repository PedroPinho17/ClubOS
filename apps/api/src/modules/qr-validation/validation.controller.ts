import { Controller, Get, Param, Query, UnauthorizedException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { verifyValidationSignature } from '../../common/qr-signature';
import { ValidationService } from './validation.service';

@Controller('api/validate')
export class ValidationController {
  constructor(private readonly validation: ValidationService) {}

  /** Endpoint publico: lido pela pagina /validar (destino do QR do cartao). */
  @Get(':memberId')
  @AllowAnonymous()
  validate(
    @Param('memberId') memberId: string,
    @Query('expires') expiresStr?: string,
    @Query('sig') sig?: string,
  ) {
    const expires = expiresStr ? Number.parseInt(expiresStr, 10) : Number.NaN;
    if (!sig || !Number.isFinite(expires) || !verifyValidationSignature(memberId, expires, sig)) {
      throw new UnauthorizedException('Link de validacao invalido ou expirado.');
    }
    return this.validation.validate(memberId);
  }
}
