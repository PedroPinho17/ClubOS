import { IsString, MinLength } from "class-validator";

export class ScanQrDto {
  @IsString()
  @MinLength(1)
  payload!: string;
}
