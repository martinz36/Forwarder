import { z } from "zod";

export const quotationItemSchema = z.object({
  description: z.string().min(1, "La descripción del concepto es requerida."),
  currency: z.enum(["USD", "PEN"]),
  unitCost: z.coerce.number().min(0, "El costo unitario debe ser mayor o igual a 0."),
  unitPrice: z.coerce.number().min(0, "El precio de venta debe ser mayor o igual a 0."),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
  isTaxable: z.boolean(),
});

export const quotationSchema = z.object({
  clientId: z.string().min(1, "Debes seleccionar un cliente."),
  validUntil: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "Debe agregar al menos un ítem a la cotización."),
});

export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;
