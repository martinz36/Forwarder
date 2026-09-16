"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { serviceSchema, ServiceFormValues } from "@/lib/validations/service";

export async function getServicesCatalogAction() {
  try {
    const services = await prisma.conceptCatalog.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: services };
  } catch (err: any) {
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al obtener el catálogo.",
      data: [],
    };
  }
}

export async function createServiceAction(data: ServiceFormValues) {
  try {
    const validated = serviceSchema.parse(data);

    // Check duplicate
    const existing = await prisma.conceptCatalog.findUnique({
      where: { name: validated.name.trim() },
    });

    if (existing) {
      return {
        success: false,
        error: `El concepto "${validated.name}" ya existe en el catálogo.`,
      };
    }

    const created = await prisma.conceptCatalog.create({
      data: {
        name: validated.name.trim(),
        category: validated.category,
        defaultCurrency: validated.defaultCurrency,
        defaultCost: validated.defaultCost ?? 0,
        defaultPrice: validated.defaultPrice ?? 0,
        isTaxable: validated.isTaxable,
      },
    });

    revalidatePath("/services");
    revalidatePath("/quotations/new");

    return { success: true, data: created };
  } catch (err: any) {
    if (err?.issues && Array.isArray(err.issues) && err.issues.length > 0) {
      return { success: false, error: err.issues[0]?.message || "Datos no válidos." };
    }
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al crear el concepto.",
    };
  }
}

export async function updateServiceAction(id: string, data: ServiceFormValues) {
  try {
    if (!id) {
      return { success: false, error: "ID de concepto no proporcionado." };
    }

    const validated = serviceSchema.parse(data);

    // Check duplicate name on another record
    const existing = await prisma.conceptCatalog.findFirst({
      where: {
        name: validated.name.trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `El concepto "${validated.name}" ya está registrado en otro ítem.`,
      };
    }

    const updated = await prisma.conceptCatalog.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        category: validated.category,
        defaultCurrency: validated.defaultCurrency,
        defaultCost: validated.defaultCost ?? 0,
        defaultPrice: validated.defaultPrice ?? 0,
        isTaxable: validated.isTaxable,
      },
    });

    revalidatePath("/services");
    revalidatePath("/quotations/new");

    return { success: true, data: updated };
  } catch (err: any) {
    if (err?.issues && Array.isArray(err.issues) && err.issues.length > 0) {
      return { success: false, error: err.issues[0]?.message || "Datos no válidos." };
    }
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al actualizar el concepto.",
    };
  }
}

export async function deleteServiceAction(id: string) {
  try {
    if (!id) {
      return { success: false, error: "ID no válido." };
    }

    await prisma.conceptCatalog.delete({
      where: { id },
    });

    revalidatePath("/services");
    revalidatePath("/quotations/new");

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al eliminar el concepto.",
    };
  }
}
