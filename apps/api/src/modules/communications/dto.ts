import { CommunicationAudience } from '@clubos/database';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  subject!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  body!: string;

  @IsEnum(CommunicationAudience)
  audience!: CommunicationAudience;

  @IsOptional()
  @IsString()
  planId?: string;
}
