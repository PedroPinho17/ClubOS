import { Controller, Get, Param } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ValidationService } from './validation.service';

@Controller('api/validate')
export class ValidationController {
  constructor(private readonly validation: ValidationService) {}

  /** Endpoint publico: lido pela pagina /validar (destino do QR do cartao). */
  @Get(':memberId')
  @AllowAnonymous()
  validate(@Param('memberId') memberId: string) {
    return this.validation.validate(memberId);
  }
}
