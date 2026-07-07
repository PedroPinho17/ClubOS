import { Controller, Post } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { OrgId } from '../../common/decorators';
import { RemindersService } from './reminders.service';

@Controller('api/reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  /** Dispara lembretes de quotas em atraso para a organizacao activa. */
  @Post('run')
  @Roles(['imperador', 'administrador'])
  run(@OrgId() organizationId: string) {
    return this.reminders.runForOrganization(organizationId);
  }
}
