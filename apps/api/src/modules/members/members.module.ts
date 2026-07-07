import { Module } from '@nestjs/common';
import { MemberExportService } from './import/member-export.service';
import { MemberImportService } from './import/member-import.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, MemberImportService, MemberExportService],
  exports: [MembersService],
})
export class MembersModule {}