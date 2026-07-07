import { IsString, MinLength } from 'class-validator';

export class SetActiveOrganizationDto {
  @IsString()
  @MinLength(1)
  organizationId!: string;
}
