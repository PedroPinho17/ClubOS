import { describe, expect, it, vi } from "vitest";
import { CardsController } from "./cards.controller";

describe("CardsController", () => {
  const cards = {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
    getCardData: vi.fn(),
  };
  const controller = new CardsController(cards as never);

  it("settings e getCard", async () => {
    await controller.getSettings("o1");
    await controller.updateSettings("o1", "administrador", {
      showPhoto: true,
    } as never);
    await controller.getCard("o1", "m1");
    expect(cards.getCardData).toHaveBeenCalledWith("o1", "m1");
  });
});
