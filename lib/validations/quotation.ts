import { z } from "zod";

export const quotationItemSchema = z.object({
  description: z.string().min(1, "La descripción del concepto es requerida."),
  category: z.enum(["GASTOS_ORIGEN", "FLETE_INTERNACIONAL", "SEGURO", "GASTOS_LOCALES"]),
  currency: z.enum(["USD", "PEN"]),
  unitCost: z.coerce.number().min(0, "El costo unitario debe ser mayor o igual a 0."),
  unitPrice: z.coerce.number().min(0, "El precio de venta debe ser mayor o igual a 0."),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser al menos 1."),
  isTaxable: z.boolean(),
});

export const quotationSchema = z.object({
  clientId: z.string().min(1, "Debes seleccionar un cliente."),
  validUntil: z.string().optional(),

  // Shipment metadata fields & Pre-Alerta document headers
  modality: z.string().optional(),
  incoterm: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  shippingType: z.string().optional(),
  shippingLine: z.string().optional(),
  frequency: z.string().optional(),
  transitTime: z.string().optional(),
  etd: z.string().optional(),
  eta: z.string().optional(),
  blNro: z.string().optional(),
  shipper: z.string().optional(),
  mercaderia: z.string().optional(),
  formaPago: z.string().optional(),
  cargoType: z.string().optional(),
  packagesCount: z.string().optional(),
  grossWeight: z.string().optional(),
  volume: z.string().optional(),
  loadType: z.string().optional(),
  containersCount: z.string().optional(),
  notes: z.string().optional(),

  items: z.array(quotationItemSchema).min(1, "Debe agregar al menos un ítem a la cotización."),
});

export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;
