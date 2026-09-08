import { z } from "zod";

export const clientSchema = z
  .object({
    documentType: z.enum(["RUC", "DNI", "CE"]),
    documentNumber: z.string().min(1, "El número de documento es requerido."),
    businessName: z.string().min(1, "La Razón Social o Nombre Completo es requerido."),
    contactName: z.string().optional(),
    email: z.string().email("Correo electrónico inválido.").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.documentType === "RUC") {
        return /^\d{11}$/.test(data.documentNumber);
      }
      if (data.documentType === "DNI") {
        return /^\d{8}$/.test(data.documentNumber);
      }
      return true;
    },
    {
      message: "Si selecciona RUC debe ingresar exactamente 11 dígitos numéricos (DNI 8 dígitos).",
      path: ["documentNumber"],
    }
  );

export type ClientFormValues = z.infer<typeof clientSchema>;
