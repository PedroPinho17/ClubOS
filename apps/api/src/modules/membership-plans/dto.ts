import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { Periodicity } from '@clubos/database';

export class CreateMembershipPlanDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsEnum(Periodicity)
  periodicity?: Periodicity;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateMembershipPlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(Periodicity)
  periodicity?: Periodicity;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
