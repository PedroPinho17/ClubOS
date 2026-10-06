import { ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  const prisma = { $queryRaw: vi.fn() };
  const redis = { ping: vi.fn() };
  const storage = { ping: vi.fn() };
  const controller = new HealthController(
    prisma as never,
    redis as never,
    storage as never,
  );

  it("health devolve ok", () => {
    const out = controller.health();
    expect(out.status).toBe("ok");
    expect(out.timestamp).toBeTruthy();
  });

  it("ready ok quando db, redis e s3 respondem", async () => {
    prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    redis.ping.mockResolvedValue("PONG");
    storage.ping.mockResolvedValue("ok");
    const out = await controller.ready();
    expect(out).toMatchObject({
      status: "ready",
      db: "ok",
      redis: "ok",
      s3: "ok",
    });
  });

  it("ready falha se redis nao PONG", async () => {
    prisma.$queryRaw.mockResolvedValue([1]);
    redis.ping.mockResolvedValue("NOPE");
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("ready falha se s3 indisponivel", async () => {
    prisma.$queryRaw.mockResolvedValue([1]);
    redis.ping.mockResolvedValue("PONG");
    storage.ping.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(controller.ready()).rejects.toThrow(/S3/i);
  });

  it("ready falha se db falha", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("down"));
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
