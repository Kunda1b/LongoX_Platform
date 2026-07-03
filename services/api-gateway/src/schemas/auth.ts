import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255).optional(),
  tenantName: z.string().min(1).max(255).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const mfaSetupSchema = z.object({
  method: z.enum(["totp", "sms", "webauthn"]),
  phoneNumber: z.string().optional(),
});

export const mfaVerifySchema = z.object({
  code: z.string().min(1),
  sessionId: z.string().min(1),
});
