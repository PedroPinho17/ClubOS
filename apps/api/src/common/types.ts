export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  organizationId?: string | null;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
    session?: unknown;
    activeOrganizationId?: string;
  }
}
