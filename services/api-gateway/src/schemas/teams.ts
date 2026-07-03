import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]),
  message: z.string().max(1000).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});
