import { HttpException, HttpStatus } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  withScope: (fn: (scope: { setTag: ReturnType<typeof vi.fn> }) => void) => {
    fn({ setTag: vi.fn() });
  },
  captureException: vi.fn(),
}));

import * as Sentry from "@sentry/node";
import { SentryExceptionFilter } from "./sentry-exception.filter";

describe("SentryExceptionFilter", () => {
  const filter = new SentryExceptionFilter();
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: "GET",
        path: "/api/x",
        route: { path: "/api/x" },
        activeOrganizationId: "o1",
      }),
      getResponse: () => response,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it("HttpException devolve body", () => {
    filter.catch(
      new HttpException("Nope", HttpStatus.BAD_REQUEST),
      host as never,
    );
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("erro nao-HTTP → 500 e captura se DSN", () => {
    process.env.SENTRY_DSN = "https://example.ingest.sentry.io/1";
    filter.catch(new Error("boom"), host as never);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("5xx HttpException captura com DSN", () => {
    process.env.SENTRY_DSN = "https://example.ingest.sentry.io/1";
    filter.catch(
      new HttpException("fail", HttpStatus.INTERNAL_SERVER_ERROR),
      host as never,
    );
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
