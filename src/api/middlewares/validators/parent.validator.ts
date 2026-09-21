import { z } from "zod";

export const parentSchema = z.object({
  name: z.string(),
});

export type ParentSchema = z.infer<typeof parentSchema>;
