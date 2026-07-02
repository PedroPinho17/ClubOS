import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [CardsModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
