import { Module } from '@nestjs/common';
import { ImportDryRunService } from './import/import-dry-run';
import { ImportMemberUpsertService } from './import/import-member-upsert';
import { ImportPaymentUpsertService } from './import/import-payment-upsert';
import { MemberExportService } from './import/member-export.service';
import { MemberImportService } from './import/member-import.service';
import { MemberGdprService } from './member-gdpr.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  controllers: [MembersController],
  providers: [
    MembersService,
    MemberImportService,
    ImportMemberUpsertService,
    ImportPaymentUpsertService,
    ImportDryRunService,
    MemberExportService,
    MemberGdprService,
  ],
  exports: [MembersService],
})
export class MembersModule {}