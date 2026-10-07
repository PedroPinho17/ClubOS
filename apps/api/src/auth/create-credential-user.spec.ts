import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, update, transaction } = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@clubos/database", () => ({
  prisma: {
    account: { findMany, update },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

import { repairCredentialAccountIds } from "./create-credential-user";

describe("repairCredentialAccountIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (ops: unknown) => ops);
    update.mockResolvedValue({});
  });

  it("nao faz nada se accountId ja e userId", async () => {
    findMany.mockResolvedValue([{ id: "a1", accountId: "u1", userId: "u1" }]);
    await expect(repairCredentialAccountIds()).resolves.toEqual({
      repaired: 0,
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("repara accountId=email para userId", async () => {
    findMany.mockResolvedValue([
      { id: "a1", accountId: "soc@x.pt", userId: "u1" },
      { id: "a2", accountId: "u2", userId: "u2" },
    ]);
    await expect(repairCredentialAccountIds()).resolves.toEqual({
      repaired: 1,
    });
    expect(transaction).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { accountId: "u1" },
    });
  });

  it("filtra por userId quando pedido", async () => {
    findMany.mockResolvedValue([]);
    await repairCredentialAccountIds({ userId: "u9" });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          providerId: "credential",
          userId: "u9",
        }),
      }),
    );
  });
});
