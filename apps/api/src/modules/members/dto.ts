import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";
import { MemberStatus } from "@clubos/database";

export class CreateMemberDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  quotaPlanId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cardRole?: string;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsString()
  quotaPlanId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cardRole?: string;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  cardValidUntil?: string | null;
}

export class GdprEraseDto {
  @IsBoolean()
  confirm!: boolean;
}
