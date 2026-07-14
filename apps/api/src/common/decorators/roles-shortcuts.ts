/**
 * @module RolesShortcuts
 * Atalhos RBAC por org activa (validados por {@link EffectiveRoleGuard}).
 *
 * @example
 * ```typescript
 * @StaffOnly()
 * @Get('members')
 * list() { ... }
 * ```
 */
import { SetMetadata } from "@nestjs/common";
import {
  ADMIN_ROLES,
  IMPERADOR_ROLES,
  PORTAL_ROLES,
  STAFF_ROLES,
} from "../roles";

export const CLUBOS_EFFECTIVE_ROLES_KEY = "clubosEffectiveRoles";

const effectiveRoles = (roles: readonly string[]) =>
  SetMetadata(CLUBOS_EFFECTIVE_ROLES_KEY, [...roles]);

/** Backoffice: imperador, administrador, tesoureiro. */
export const StaffOnly = () => effectiveRoles(STAFF_ROLES);

/** Administracao do clube: imperador, administrador. */
export const AdminOnly = () => effectiveRoles(ADMIN_ROLES);

/** Super-admin da plataforma. */
export const ImperadorOnly = () => effectiveRoles(IMPERADOR_ROLES);

/** Portal do socio. */
export const PortalOnly = () => effectiveRoles(PORTAL_ROLES);
