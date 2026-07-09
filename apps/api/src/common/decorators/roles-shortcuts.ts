/**
 * @module RolesShortcuts
 * Atalhos para `@Roles([...])` usando constantes centralizadas em `roles.ts`.
 *
 * @example
 * ```typescript
 * @StaffOnly()
 * @Get('members')
 * list() { ... }
 * ```
 */
import { Roles } from '@thallesp/nestjs-better-auth';
import { ADMIN_ROLES, IMPERADOR_ROLES, PORTAL_ROLES, STAFF_ROLES } from '../roles';

/** Backoffice: imperador, administrador, tesoureiro. */
export const StaffOnly = () => Roles([...STAFF_ROLES]);

/** Administracao do clube: imperador, administrador. */
export const AdminOnly = () => Roles([...ADMIN_ROLES]);

/** Super-admin da plataforma. */
export const ImperadorOnly = () => Roles([...IMPERADOR_ROLES]);

/** Portal do socio. */
export const PortalOnly = () => Roles([...PORTAL_ROLES]);
