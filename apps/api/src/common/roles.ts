/**
 * @module Roles
 * Re-exporta constantes de `@clubos/shared` (fonte única).
 * Usar com `@StaffOnly()`, `@AdminOnly()`, etc. em vez de arrays inline.
 */

export {
  ADMIN_ROLES,
  IMPERADOR_ROLES,
  PORTAL_ROLES,
  STAFF_ROLES,
  isAdminRole,
  isImperadorRole,
  isPortalRole,
  isStaffRole,
  type AdminRole,
  type PlatformRole,
  type PortalRole,
  type StaffRole,
} from "@clubos/shared";
