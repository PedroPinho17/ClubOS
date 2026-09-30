import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Obrigatorio"),
    newPassword: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Minimo 8 caracteres"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As palavras-passe nao coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const paymentMethodSchema = z.enum([
  "CASH",
  "TRANSFER",
  "CARD",
  "MBWAY",
  "OTHER",
]);

export const createPaymentSchema = z.object({
  memberId: z.string().min(1),
  quotaPlanId: z.string().optional(),
  amount: z.number().positive().optional(),
  method: paymentMethodSchema.optional(),
  reference: z.string().optional(),
  paidAt: z.string().datetime().optional().or(z.string().date().optional()),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const registerDeviceSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
  appVersion: z.string().optional(),
  organizationId: z.string().optional(),
  preferences: z
    .object({
      quotas: z.boolean().optional(),
      communications: z.boolean().optional(),
      payments: z.boolean().optional(),
    })
    .optional(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

export const scanQrSchema = z.object({
  payload: z.string().min(1),
});

export type ScanQrInput = z.infer<typeof scanQrSchema>;

export const accountDeletionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;
