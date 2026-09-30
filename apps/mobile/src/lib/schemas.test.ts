import { loginSchema, createPaymentSchema } from "@clubos/shared";

describe("shared schemas", () => {
  it("valida login", () => {
    expect(
      loginSchema.safeParse({
        email: "a@b.com",
        password: "password1",
      }).success,
    ).toBe(true);
  });

  it("valida createPayment", () => {
    expect(
      createPaymentSchema.safeParse({
        memberId: "mem_1",
        amount: 10,
        method: "CASH",
      }).success,
    ).toBe(true);
  });
});
