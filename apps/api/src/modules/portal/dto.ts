import { MinLength } from "class-validator";

/** Password inicial definida pelo admin ao conceder acesso ao portal. */
export class GrantPortalAccessDto {
  @MinLength(8, { message: "A password deve ter pelo menos 8 caracteres." })
  password!: string;
}
