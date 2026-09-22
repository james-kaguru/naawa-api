import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  paginate: z.coerce.boolean().default(false)
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
