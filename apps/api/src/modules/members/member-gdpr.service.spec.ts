import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import {
  GDPR_ERASED_NAME,
  MemberGdprService,
  isGdprErased,
} from "./member-gdpr.service";

describe("member-gdpr", () => {
  it("isGdprErased identifica membro apagado", () => {
    expect(isGdprErased({ name: GDPR_ERASED_NAME })).toBe(true);
    expect(isGdprErased({ name: "Joao Silva" })).toBe(false);
  });

  it("buildExport devolve JSON tipado", async () => {
    const joinedAt = new Date("2024-01-01T00:00:00.000Z");
    const prisma = {
      member: {
        findFirst: vi.fn().mockResolvedValue({
          id: "m1",
          number: 1,
          name: "Ana",
          email: "ana@example.com",
          phone: null,
          joinedAt,
          status: "ACTIVE",
          cardRole: null,
          cardValidUntil: null,
          notes: null,
          userId: "u1",
          organization: { id: "o1", name: "CRC", slug: "crc" },
          quotaPlan: {
            id: "p1",
            name: "Mensal",
            amount: { toString: () => "10" },
            periodicity: "MONTHLY",
          },
          payments: [
            {
              id: "pay1",
              amount: { toString: () => "10" },
              method: "CASH",
              status: "PAID",
              reference: null,
              paidAt: joinedAt,
              createdAt: joinedAt,
              quotaPlan: { id: "p1", name: "Mensal" },
            },
          ],
        }),
      },
    };
    const service = new MemberGdprService(
      prisma as never,
      {
        deleteObject: vi.fn(),
      } as never,
    );

    const exported = await service.buildExport("o1", "m1");
    expect(exported.format).toBe("clubos-gdpr-v1");
    expect(exported.member.email).toBe("ana@example.com");
    expect(exported.payments).toHaveLength(1);
  });

  it("buildExport 404 se membro nao existe", async () => {
    const service = new MemberGdprService(
      { member: { findFirst: vi.fn().mockResolvedValue(null) } } as never,
      { deleteObject: vi.fn() } as never,
    );
    await expect(service.buildExport("o1", "x")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("erasePersonalData apaga a fotografia no storage", async () => {
    const member = {
      id: "m1",
      name: "Ana",
      userId: null,
      photoKey: "org/m1/photo.jpg",
    };
    const prisma = {
      member: {
        findFirst: vi.fn().mockResolvedValue(member),
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          member: { update: vi.fn().mockResolvedValue({}) },
          quotaReminderSent: { deleteMany: vi.fn().mockResolvedValue({}) },
        }),
      ),
    };
    const storage = { deleteObject: vi.fn().mockResolvedValue(undefined) };
    const service = new MemberGdprService(prisma as never, storage as never);

    const result = await service.erasePersonalData("org1", "m1");

    expect(storage.deleteObject).toHaveBeenCalledWith("org/m1/photo.jpg");
    expect(result).toMatchObject({
      success: true,
      memberId: "m1",
      photoDeleted: true,
    });
  });

  it("erasePersonalData rejeita se ja apagado", async () => {
    const service = new MemberGdprService(
      {
        member: {
          findFirst: vi.fn().mockResolvedValue({
            id: "m1",
            name: GDPR_ERASED_NAME,
            userId: null,
            photoKey: null,
          }),
        },
      } as never,
      { deleteObject: vi.fn() } as never,
    );
    await expect(service.erasePersonalData("o1", "m1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("erasePersonalData 404 se membro nao existe", async () => {
    const service = new MemberGdprService(
      { member: { findFirst: vi.fn().mockResolvedValue(null) } } as never,
      { deleteObject: vi.fn() } as never,
    );
    await expect(service.erasePersonalData("o1", "x")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
