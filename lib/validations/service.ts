import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "El nombre del concepto/servicio es obligatorio."),
  category: z.string().default("GASTOS_LOCALES"),
  defaultCurrency: z.enum(["USD", "PEN"]).default("USD"),
  defaultCost: z.number().min(0).optional().default(0),
  defaultPrice: z.number().min(0).optional().nullable(),
  isTaxable: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
