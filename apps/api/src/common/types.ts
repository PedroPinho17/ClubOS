export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
    session?: unknown;
    activeOrganizationId?: string;
  }
}
