/** Roles com acesso ao backoffice (staff) — fonte: `@clubos/shared`. */
export { STAFF_ROLES, isStaffRole, type StaffRole } from "@clubos/shared";

/** @deprecated Preferir isStaffRole — alias para compatibilidade. */
export { isStaffRole as isAdminRole } from "@clubos/shared";
