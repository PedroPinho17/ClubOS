import { Module } from "@nestjs/common";
import { HostOrgController } from "../public/host-org.controller";
import { OrganizationsListController } from "./organizations-list.controller";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";

@Module({
  controllers: [
    OrganizationsController,
    OrganizationsListController,
    HostOrgController,
  ],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
