import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string().trim().min(2),
  memberId: z.string().trim().min(2),
});

export type CreateParentSchema = z.infer<typeof createParentSchema>;
