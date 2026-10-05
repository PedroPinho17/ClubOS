import { describe, expect, it, vi } from "vitest";
import { ImportMemberUpsertService } from "./import-member-upsert";

describe("ImportMemberUpsertService", () => {
  const service = new ImportMemberUpsertService();

  it("nextNumber devolve max+1", async () => {
    const tx = {
      member: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { number: "3" },
            { number: "10" },
            { number: "abc" },
          ]),
      },
    };
    await expect(service.nextNumber(tx as never, "org-1")).resolves.toBe("11");
  });

  it("nextNumber comeca em 1 se vazio", async () => {
    const tx = { member: { findMany: vi.fn().mockResolvedValue([]) } };
    await expect(service.nextNumber(tx as never, "org-1")).resolves.toBe("1");
  });

  it("upsert actualiza membro existente", async () => {
    const updated = { id: "m1", number: "5", name: "Nova" };
    const tx = {
      member: {
        update: vi.fn().mockResolvedValue(updated),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };
    const existing = { id: "m1", number: "5", name: "Antiga" } as never;
    const payload = {
      name: "Nova",
      email: null,
      phone: null,
      joinedAt: new Date(),
      cardRole: null,
      cardValidUntil: null,
      status: "ACTIVE",
      notes: null,
      quotaPlanId: null,
      number: "5",
    };

    const result = await service.upsert(
      tx as never,
      "org-1",
      existing,
      payload,
    );
    expect(result).toEqual(updated);
    expect(tx.member.update).toHaveBeenCalled();
    expect(tx.member.create).not.toHaveBeenCalled();
  });

  it("upsert cria membro novo com nextNumber", async () => {
    const created = { id: "m2", number: "1", name: "Ana" };
    const tx = {
      member: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(created),
        update: vi.fn(),
      },
    };
    const payload = {
      name: "Ana",
      email: "a@x.pt",
      phone: null,
      joinedAt: new Date(),
      cardRole: null,
      cardValidUntil: null,
      status: "ACTIVE",
      notes: null,
      quotaPlanId: "plan-1",
      number: undefined,
    };

    const result = await service.upsert(tx as never, "org-1", null, payload);
    expect(result).toEqual(created);
    expect(tx.member.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          number: "1",
          name: "Ana",
        }),
      }),
    );
  });
});
