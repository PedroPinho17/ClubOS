import {
  Allow,
  IsArray,
  IsHexColor,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imperadorUserIds?: string[];
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  logoKey?: string;

  /** Hostname do clube (ex.: www.crcvale.pt). Vazio remove. So Imperador. */
  @IsOptional()
  @IsString()
  domain?: string | null;
}

export class SetSettingDto {
  @IsString()
  key!: string;

  @Allow()
  value!: unknown;
}
