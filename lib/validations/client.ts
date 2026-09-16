import { z } from "zod";

/**
 * Clean non-numeric characters for RUC and cap at 11 digits
 */
export function cleanRucDigits(val?: string | null): string {
  if (!val) return "";
  return val.replace(/\D/g, "").slice(0, 11);
}

/**
 * Auto-formats phone input into standard Peruvian cell phone format (9XX XXX XXX)
 */
export function formatPeruvianPhone(val?: string | null): string {
  if (!val) return "";
  
  // Extract all digits
  let digits = val.replace(/\D/g, "");

  // If leading 51 (Peru country code) and 11 digits total (e.g. 51969301095)
  if (digits.startsWith("51") && digits.length === 11) {
    digits = digits.slice(2);
  }

  // 9-digit Peruvian mobile phone (starts with 9)
  if (digits.length === 9 && digits.startsWith("9")) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }

  // Formatting in progress (less than 9 digits starting with 9)
  if (digits.length > 0 && digits.length < 9 && digits.startsWith("9")) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return val.trim();
}

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
      const cleanDoc = data.documentNumber.replace(/\D/g, "");
      if (data.documentType === "RUC") {
        return /^\d{11}$/.test(cleanDoc);
      }
      if (data.documentType === "DNI") {
        return /^\d{8}$/.test(cleanDoc);
      }
      return true;
    },
    {
      message: "Si selecciona RUC debe ingresar exactamente 11 dígitos numéricos sin espacios ni guiones (DNI 8 dígitos).",
      path: ["documentNumber"],
    }
  );

export type ClientFormValues = z.infer<typeof clientSchema>;
