import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export const INVITABLE_ROLES = ['administrador', 'tesoureiro'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export class InviteUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsIn(INVITABLE_ROLES)
  role!: InvitableRole;
}
