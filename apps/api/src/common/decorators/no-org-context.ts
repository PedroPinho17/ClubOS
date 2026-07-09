import { SetMetadata } from '@nestjs/common';

export const NO_ORG_CONTEXT_KEY = 'noOrgContext';

/**
 * Marca rota autenticada que **nao** exige tenant activo resolvido.
 * Ex.: listar orgs do utilizador (`/api/me/organizations`).
 */
export const NoOrgContext = () => SetMetadata(NO_ORG_CONTEXT_KEY, true);
