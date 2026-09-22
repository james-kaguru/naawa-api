import { z } from "zod";

export const createParentSchema = z.object({
  name: z.string(),
  memberId: z.string(),
});

export type CreateParentSchema = z.infer<typeof createParentSchema>;
