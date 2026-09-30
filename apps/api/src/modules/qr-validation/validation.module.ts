import { Module } from "@nestjs/common";
import { AuditModule } from "../../core/audit/audit.module";
import { ValidationController } from "./validation.controller";
import { ValidationService } from "./validation.service";

@Module({
  imports: [AuditModule],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
