import { Periodicity } from "@clubos/database";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeQuotaSituation } from "./quota.util";

describe("manual dates and quota baseline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sócio com adesão antiga e sem pagamentos fica em atraso (mensal)", () => {
    const r = computeQuotaSituation({
      periodicity: Periodicity.MONTHLY,
      joinedAt: new Date("2020-01-01T00:00:00.000Z"),
      lastPaidAt: null,
    });
    expect(r.status).toBe("overdue");
  });

  it("pagamento com data passada recalcula quota com base no último pago", () => {
    const joinedAt = new Date("2020-01-01T00:00:00.000Z");
    const withoutPayment = computeQuotaSituation({
      periodicity: Periodicity.MONTHLY,
      joinedAt,
      lastPaidAt: null,
    });
    expect(withoutPayment.status).toBe("overdue");

    const withPastPayment = computeQuotaSituation({
      periodicity: Periodicity.MONTHLY,
      joinedAt,
      lastPaidAt: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(withPastPayment.status).toBe("up_to_date");
    expect(withPastPayment.nextDueDate).toBeTruthy();
  });
});
