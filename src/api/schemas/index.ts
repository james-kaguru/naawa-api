import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  paginate:  z.stringbool().default(false)
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const currencySchema = z.string().trim().toUpperCase().length(3);

export const validPeriod = {
  check: (data: { periodStart?: string | undefined; periodEnd?: string | undefined }) =>
    !data.periodStart || !data.periodEnd || data.periodEnd >= data.periodStart,
  error: { message: "periodEnd cannot be before periodStart", path: ["periodEnd"] },
};
