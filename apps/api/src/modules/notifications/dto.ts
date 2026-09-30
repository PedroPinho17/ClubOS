import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class DevicePreferencesDto {
  @IsOptional()
  quotas?: boolean;

  @IsOptional()
  communications?: boolean;

  @IsOptional()
  payments?: boolean;
}

export class RegisterDeviceDto {
  @IsString()
  token!: string;

  @IsIn(["ios", "android", "web"])
  platform!: "ios" | "android" | "web";

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DevicePreferencesDto)
  preferences?: DevicePreferencesDto;
}

export class UpdateDevicePreferencesDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DevicePreferencesDto)
  preferences?: DevicePreferencesDto;
}
