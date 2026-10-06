import { beforeEach, describe, expect, it, vi } from "vitest";

const createTransport = vi.hoisted(() => vi.fn());

vi.mock("nodemailer", () => ({
  createTransport,
}));

describe("MailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.SMTP_HOST;
    delete process.env.NODE_ENV;
    process.env.MAIL_FROM = "ClubOS <test@clubos.local>";
  });

  it("modo dev usa jsonTransport e loga envio", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "dev-1" });
    createTransport.mockReturnValue({ sendMail });
    const { MailService } = await import("./mail.service");
    const mail = new MailService();
    await mail.send({ to: "a@x.pt", subject: "Oi", text: "ola" });
    expect(createTransport).toHaveBeenCalledWith({ jsonTransport: true });
    expect(sendMail).toHaveBeenCalled();
  });

  it("com SMTP_HOST usa transporte real", async () => {
    process.env.SMTP_HOST = "smtp.resend.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";
    process.env.SMTP_USER = "resend";
    process.env.SMTP_PASS = "re_x";
    const sendMail = vi.fn().mockResolvedValue({ messageId: "m1" });
    createTransport.mockReturnValue({ sendMail });
    const { MailService } = await import("./mail.service");
    const mail = new MailService();
    await mail.send({
      to: "a@x.pt",
      subject: "S",
      html: "<p>x</p>",
      attachments: [
        {
          filename: "a.pdf",
          content: Buffer.from("%PDF"),
          contentType: "application/pdf",
        },
      ],
    });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
      }),
    );
  });

  it("producao sem SMTP_HOST lanca", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.SMTP_HOST;
    await expect(async () => {
      const { MailService } = await import("./mail.service");
      new MailService();
    }).rejects.toThrow(/SMTP_HOST/);
  });
});
