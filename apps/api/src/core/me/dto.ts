import { IsOptional, IsString, MaxLength } from "class-validator";

export class SetActiveOrganizationDto {
  @IsString()
  organizationId!: string;
}

export class AccountDeletionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
