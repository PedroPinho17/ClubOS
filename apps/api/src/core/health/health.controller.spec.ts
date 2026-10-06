import { ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  const prisma = { $queryRaw: vi.fn() };
  const redis = { ping: vi.fn() };
  const controller = new HealthController(prisma as never, redis as never);

  it("health devolve ok", () => {
    const out = controller.health();
    expect(out.status).toBe("ok");
    expect(out.timestamp).toBeTruthy();
  });

  it("ready ok quando db e redis respondem", async () => {
    prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    redis.ping.mockResolvedValue("PONG");
    const out = await controller.ready();
    expect(out).toMatchObject({ status: "ready", db: "ok", redis: "ok" });
  });

  it("ready falha se redis nao PONG", async () => {
    prisma.$queryRaw.mockResolvedValue([1]);
    redis.ping.mockResolvedValue("NOPE");
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("ready falha se db falha", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("down"));
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
