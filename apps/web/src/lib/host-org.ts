import { ApiError } from "./api";

export type HostOrgResponse =
  | { kind: "platform"; passkeysEnabled: boolean }
  | {
      kind: "org";
      id: string;
      name: string;
      primaryColor: string;
      logoUrl: string | null;
      passkeysEnabled: boolean;
    };

export function isHostOrgMismatch(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    /nao pertence a este clube/i.test(error.message)
  );
}
