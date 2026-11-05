import { z } from "zod";

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1).default("member"),
});

export type AddMemberSchema = z.infer<typeof addMemberSchema>;
