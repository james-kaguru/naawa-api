import { currencySchema, paginationQuerySchema, validPeriod } from "@/api/schemas";
import { invoiceStatus } from "@/db/schema";
import { z } from "zod";

export const childrenCentreInvoiceParamsSchema = z.object({
  childrenCentreId: z.uuid(),
});

export type ChildrenCentreInvoiceParamsSchema = z.infer<
  typeof childrenCentreInvoiceParamsSchema
>;

export const invoiceParamsSchema = childrenCentreInvoiceParamsSchema.extend({
  invoiceId: z.uuid(),
});

export type InvoiceParamsSchema = z.infer<typeof invoiceParamsSchema>;

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().int().min(1).default(1),
  unitAmount: z.number().int().min(0),
});

export const createInvoiceSchema = z
  .object({
    childId: z.uuid(),
    currency: currencySchema,
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    dueDate: z.iso.date(),
    tax: z.number().int().min(0).optional(),
    notes: z.string().trim().optional(),
    items: z.array(invoiceItemSchema).min(1),
    confirmOverlap: z.boolean().optional(),
  })
  .refine(validPeriod.check, validPeriod.error);

export type CreateInvoiceSchema = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z
  .object({
    currency: currencySchema.optional(),
    dueDate: z.iso.date().optional(),
    tax: z.number().int().min(0).optional(),
    notes: z.string().trim().optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateInvoiceSchema = z.infer<typeof updateInvoiceSchema>;

export const findInvoicesSchema = paginationQuerySchema.extend({
  childId: z.uuid().optional(),
  parentId: z.uuid().optional(),
  periodStart: z.iso.date().optional(),
  status: z.enum(invoiceStatus.enumValues).optional(),
});

export type FindInvoicesSchema = z.infer<typeof findInvoicesSchema>;

export const findOverlappingInvoicesSchema = z
  .object({
    childId: z.uuid(),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
  })
  .refine(validPeriod.check, validPeriod.error);

export type FindOverlappingInvoicesSchema = z.infer<
  typeof findOverlappingInvoicesSchema
>;
