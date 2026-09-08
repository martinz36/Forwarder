"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";

const conceptSchema = z.object({
  name: z.string().min(1, "El nombre del concepto es obligatorio."),
  defaultCurrency: z.enum(["USD", "PEN"]).default("USD"),
  defaultPrice: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0.").optional(),
  isTaxable: z.boolean().default(true),
});

export async function createConceptAction(data: z.infer<typeof conceptSchema>) {
  const validated = conceptSchema.parse(data);

  const existing = await prisma.conceptCatalog.findUnique({
    where: { name: validated.name.trim() },
  });

  if (existing) {
    throw new Error("Ya existe un concepto registrado con este nombre en el catálogo.");
  }

  const created = await prisma.conceptCatalog.create({
    data: {
      name: validated.name.trim(),
      defaultCurrency: validated.defaultCurrency,
      defaultPrice: validated.defaultPrice ?? 0,
      isTaxable: validated.isTaxable,
    },
  });

  revalidatePath("/catalog");
  revalidatePath("/quotations/new");
  return created;
}

export async function updateConceptAction(id: string, data: z.infer<typeof conceptSchema>) {
  const validated = conceptSchema.parse(data);

  const existing = await prisma.conceptCatalog.findFirst({
    where: {
      name: validated.name.trim(),
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Ya existe otro concepto registrado con este nombre.");
  }

  const updated = await prisma.conceptCatalog.update({
    where: { id },
    data: {
      name: validated.name.trim(),
      defaultCurrency: validated.defaultCurrency,
      defaultPrice: validated.defaultPrice ?? 0,
      isTaxable: validated.isTaxable,
    },
  });

  revalidatePath("/catalog");
  revalidatePath("/quotations/new");
  return updated;
}

export async function deleteConceptAction(id: string) {
  await prisma.conceptCatalog.delete({
    where: { id },
  });

  revalidatePath("/catalog");
  revalidatePath("/quotations/new");
}
