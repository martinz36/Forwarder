"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

const DEFAULT_CHECKLIST_ITEMS = [
  {
    title: "1. Bill of Lading (HBL / BL / Guía Aérea)",
    description: "Documento de transporte principal emitido por naviera o agente de origen.",
    documentType: "BL",
    order: 1,
  },
  {
    title: "2. Factura Comercial & Packing List",
    description: "Documentación comercial del exportador necesaria para transmisión aduanera.",
    documentType: "FACTURA_COMERCIAL",
    order: 2,
  },
  {
    title: "3. DAM / Declaración de Aduana",
    description: "Declaración Aduanera de Mercancías numerada ante SUNAT.",
    documentType: "DAM",
    order: 3,
  },
  {
    title: "4. Volante & Guía de Transporte Local",
    description: "Autorización de retiro de depósito temporal y transporte de entrega en almacén.",
    documentType: "OTRO",
    order: 4,
  },
  {
    title: "5. Liquidación de Gastos Operativos",
    description: "Documento de cobranza final de servicios logísticos y reembolsos de despacho.",
    documentType: "LIQUIDACION",
    order: 5,
  },
];

export async function seedDefaultChecklistItemsAction(operationId: string) {
  try {
    const existingCount = await prisma.checklistItem.count({
      where: { operationId },
    });

    if (existingCount > 0) {
      return { success: true, message: "Checklist ya cuenta con elementos." };
    }

    // Check if documents already exist for this operation to pre-mark completion
    const existingDocs = await prisma.document.findMany({
      where: { operationId },
      select: { documentType: true },
    });
    const docTypesSet = new Set(existingDocs.map((d) => d.documentType));

    await prisma.checklistItem.createMany({
      data: DEFAULT_CHECKLIST_ITEMS.map((item) => ({
        operationId,
        title: item.title,
        description: item.description,
        documentType: item.documentType,
        order: item.order,
        isCompleted: docTypesSet.has(item.documentType as any),
      })),
    });

    revalidatePath(`/operations/${operationId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in seedDefaultChecklistItemsAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al inicializar el checklist.",
    };
  }
}

export interface AddChecklistItemInput {
  operationId: string;
  title: string;
  description?: string;
  documentType?: string;
}

export async function addChecklistItemAction(input: AddChecklistItemInput) {
  try {
    if (!input.operationId || !input.title?.trim()) {
      return { success: false, error: "El título del requisito es obligatorio." };
    }

    const lastItem = await prisma.checklistItem.findFirst({
      where: { operationId: input.operationId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (lastItem?.order || 0) + 1;
    const documentType = input.documentType || "OTRO";

    // Check if a document of this type already exists
    const existingDoc = await prisma.document.findFirst({
      where: {
        operationId: input.operationId,
        documentType: documentType as any,
      },
    });

    const newItem = await prisma.checklistItem.create({
      data: {
        operationId: input.operationId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        documentType,
        order: nextOrder,
        isCompleted: Boolean(existingDoc),
      },
    });

    revalidatePath(`/operations/${input.operationId}`);
    return { success: true, data: newItem };
  } catch (err: any) {
    console.error("Error in addChecklistItemAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al agregar el requisito.",
    };
  }
}

export async function deleteChecklistItemAction(checklistItemId: string, operationId: string) {
  try {
    await prisma.checklistItem.delete({
      where: { id: checklistItemId },
    });

    revalidatePath(`/operations/${operationId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteChecklistItemAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al eliminar el requisito.",
    };
  }
}

export async function toggleChecklistItemCompleteAction(
  checklistItemId: string,
  operationId: string,
  isCompleted: boolean
) {
  try {
    await prisma.checklistItem.update({
      where: { id: checklistItemId },
      data: { isCompleted },
    });

    revalidatePath(`/operations/${operationId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in toggleChecklistItemCompleteAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al cambiar estado.",
    };
  }
}
