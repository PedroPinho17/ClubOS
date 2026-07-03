import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { PaymentsModule } from '../payments/payments.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [CardsModule, PaymentsModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
