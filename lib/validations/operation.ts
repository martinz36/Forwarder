import { z } from "zod";

export const operationHeaderSchema = z.object({
  status: z.enum(["EN_TRANSITO", "EN_ADUANA", "RETIRADO", "LIQUIDADO"]),
  blNumber: z.string().optional(),
  etd: z.string().optional(),
  eta: z.string().optional(),
  customsChannel: z.enum(["VERDE", "NARANJA", "ROJO"]).optional().or(z.literal("")),
});

export const extraChargeSchema = z.object({
  description: z.string().min(1, "La descripción del sobrecosto es requerida."),
  currency: z.enum(["USD", "PEN"]),
  unitCost: z.coerce.number().min(0, "El costo unitario debe ser >= 0."),
  unitPrice: z.coerce.number().min(0, "El precio de venta debe ser >= 0."),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
  isTaxable: z.boolean(),
});

export type OperationHeaderFormValues = z.infer<typeof operationHeaderSchema>;
export type ExtraChargeFormValues = z.infer<typeof extraChargeSchema>;
