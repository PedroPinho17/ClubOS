import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { Roles } from '@thallesp/nestjs-better-auth';
import { CurrentUser, OrgId, RequireModule } from '../../common/decorators';
import type { AuthUser } from '../../common/types';
import { ModuleGuard } from '../../common/guards/module.guard';
import { CardsService } from './cards.service';
import { UpdateCardSettingsDto } from './dto';

@Controller('api/cards')
@RequireModule('cards')
@UseGuards(ModuleGuard)
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get('settings')
  getSettings(@OrgId() organizationId: string) {
    return this.cards.getSettings(organizationId);
  }

  @Put('settings')
  @Roles(['imperador', 'administrador'])
  updateSettings(
    @OrgId() organizationId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCardSettingsDto,
  ) {
    return this.cards.updateSettings(organizationId, dto, user.role);
  }

  @Get(':memberId')
  getCard(@OrgId() organizationId: string, @Param('memberId') memberId: string) {
    return this.cards.getCardData(organizationId, memberId);
  }
}
