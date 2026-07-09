import { SetMetadata } from '@nestjs/common';

export const NO_ORG_CONTEXT_KEY = 'noOrgContext';

/** Rota autenticada que nao exige tenant activo (ex.: listar orgs do utilizador). */
export const NoOrgContext = () => SetMetadata(NO_ORG_CONTEXT_KEY, true);
