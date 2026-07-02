import {
  IsBoolean,
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CARD_TEMPLATES, type CardTemplate, type QrContent } from './card-layout';

export class UpdateCardSettingsDto {
  @IsOptional()
  @IsIn(CARD_TEMPLATES as unknown as string[])
  template?: CardTemplate;

  @IsOptional()
  @IsBoolean()
  crcValeEnabled?: boolean;

  @IsOptional()
  @IsHexColor()
  gradientFrom?: string;

  @IsOptional()
  @IsHexColor()
  gradientTo?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cardTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  cargoLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  numeroPrefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  footerText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slogan?: string;

  @IsOptional()
  @IsIn(['validacao', 'numero', 'dados'])
  qrContent?: QrContent;

  @IsOptional() @IsBoolean() showNome?: boolean;
  @IsOptional() @IsBoolean() showNumero?: boolean;
  @IsOptional() @IsBoolean() showFoto?: boolean;
  @IsOptional() @IsBoolean() showValidade?: boolean;
  @IsOptional() @IsBoolean() showCargo?: boolean;
  @IsOptional() @IsBoolean() showPlano?: boolean;
  @IsOptional() @IsBoolean() showEmail?: boolean;
  @IsOptional() @IsBoolean() showTelefone?: boolean;
  @IsOptional() @IsBoolean() showAdesao?: boolean;
}
