import { ForbiddenException } from "@nestjs/common";
import type { AuthUser } from "./types";

const HEADER = "x-organization-id";

export function readOrgHeader(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const raw = headers[HEADER];
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0]?.trim()) return raw[0].trim();
  return undefined;
}

/** Le org activa ja validada pelo OrganizationContextGuard. */
export function getActiveOrganizationId(request: {
  activeOrganizationId?: string;
  user?: AuthUser;
}): string {
  if (request.activeOrganizationId) {
    return request.activeOrganizationId;
  }
  throw new ForbiddenException("Contexto de organizacao em falta.");
}
