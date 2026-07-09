/** Staff do backoffice (exclui socio do portal). */
export const STAFF_ROLES = ['imperador', 'administrador', 'tesoureiro'] as const;

/** Administracao da organizacao. */
export const ADMIN_ROLES = ['imperador', 'administrador'] as const;

/** Portal do socio. */
export const PORTAL_ROLES = ['socio'] as const;

/** Super-admin da plataforma. */
export const IMPERADOR_ROLES = ['imperador'] as const;
