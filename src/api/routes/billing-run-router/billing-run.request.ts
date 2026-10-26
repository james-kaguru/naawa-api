import { currencySchema, paginationQuerySchema, validPeriod } from "@/api/schemas";
import { z } from "zod";

export const childrenCentreBillingRunParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreBillingRunParamsSchema = z.infer<
  typeof childrenCentreBillingRunParamsSchema
>;

export const billingRunParamsSchema = childrenCentreBillingRunParamsSchema.extend({
  billingRunId: z.uuid(),
});

export type BillingRunParamsSchema = z.infer<typeof billingRunParamsSchema>;

export const generateInvoicesSchema = z
  .object({
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    dueDate: z.iso.date(),
    currency: currencySchema,
    description: z.string().trim().min(1),
    amount: z.number().int().positive(),
  })
  .refine(validPeriod.check, validPeriod.error);

export type GenerateInvoicesSchema = z.infer<typeof generateInvoicesSchema>;

export const findBillingRunsSchema = paginationQuerySchema.extend({
  periodStart: z.iso.date().optional(),
});

export type FindBillingRunsSchema = z.infer<typeof findBillingRunsSchema>;
