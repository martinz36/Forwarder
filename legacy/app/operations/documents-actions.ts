"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export interface CreateDocumentInput {
  operationId: string;
  name: string;
  fileUrl: string;
  documentType: "BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "LIQUIDACION" | "OTRO";
  uploadedBy: "BROKER" | "CLIENT";
  isPublic?: boolean;
  isDraft?: boolean;
  checklistItemId?: string;
}

export async function createDocumentAction(input: CreateDocumentInput) {
  try {
    if (!input.operationId || !input.name || !input.fileUrl) {
      return { success: false, error: "Información del documento incompleta." };
    }

    const isPublic = input.uploadedBy === "CLIENT" ? true : Boolean(input.isPublic);
    const isDraft = input.isDraft !== undefined ? input.isDraft : true;

    // Check if document of same documentType already exists for this operation
    const existingDoc = await prisma.document.findFirst({
      where: {
        operationId: input.operationId,
        documentType: input.documentType,
      },
    });

    let doc;
    if (existingDoc) {
      // Replace / Update existing document
      doc = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          name: input.name.trim(),
          fileUrl: input.fileUrl.trim(),
          uploadedBy: input.uploadedBy,
          isPublic,
          isDraft,
          uploadedAt: new Date(),
        },
      });
    } else {
      // Create new document
      doc = await prisma.document.create({
        data: {
          operationId: input.operationId,
          name: input.name.trim(),
          fileUrl: input.fileUrl.trim(),
          documentType: input.documentType,
          uploadedBy: input.uploadedBy,
          isPublic,
          isDraft,
        },
      });
    }

    // Automatic Checklist Item Completion
    if (input.checklistItemId) {
      await prisma.checklistItem.update({
        where: { id: input.checklistItemId },
        data: { isCompleted: true },
      });
    } else {
      await prisma.checklistItem.updateMany({
        where: {
          operationId: input.operationId,
          documentType: input.documentType,
        },
        data: { isCompleted: true },
      });
    }

    // Automatic Milestone Fulfillment based on Document Type
    const milestoneUpdates: Record<string, boolean> = {};
    if (input.documentType === "BL") {
      milestoneUpdates.hblApproved = true;
    } else if (input.documentType === "FACTURA_COMERCIAL" || input.documentType === "PACKING_LIST") {
      milestoneUpdates.customsDocsSent = true;
    } else if (input.documentType === "DAM") {
      milestoneUpdates.taxesPaid = true;
    } else if (input.documentType === "OTRO") {
      milestoneUpdates.transportDocsSent = true;
      milestoneUpdates.cargoDelivered = true;
    }

    if (Object.keys(milestoneUpdates).length > 0) {
      await prisma.operation.update({
        where: { id: input.operationId },
        data: milestoneUpdates,
      });
    }

    const operation = await prisma.operation.findUnique({
      where: { id: input.operationId },
      select: { sharedToken: true },
    });

    revalidatePath(`/operations/${input.operationId}`);
    revalidatePath("/operations");
    if (operation?.sharedToken) {
      revalidatePath(`/shared/${operation.sharedToken}`);
    }

    return { success: true, data: doc };
  } catch (err: any) {
    console.error("Error in createDocumentAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al registrar el documento.",
    };
  }
}

export async function toggleDocumentDraftStatusAction(documentId: string, operationId: string, isDraft: boolean) {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: { isDraft },
    });

    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: { sharedToken: true },
    });

    revalidatePath(`/operations/${operationId}`);
    revalidatePath("/operations");
    if (operation?.sharedToken) {
      revalidatePath(`/shared/${operation.sharedToken}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in toggleDocumentDraftStatusAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al cambiar estado de borrador.",
    };
  }
}

export async function deleteDocumentAction(documentId: string, operationId: string) {
  try {
    const docToDelete = await prisma.document.findUnique({
      where: { id: documentId },
      select: { documentType: true },
    });

    await prisma.document.delete({
      where: { id: documentId },
    });

    if (docToDelete) {
      const remainingDocCount = await prisma.document.count({
        where: {
          operationId,
          documentType: docToDelete.documentType,
        },
      });

      if (remainingDocCount === 0) {
        await prisma.checklistItem.updateMany({
          where: {
            operationId,
            documentType: docToDelete.documentType,
          },
          data: { isCompleted: false },
        });
      }
    }

    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: { sharedToken: true },
    });

    revalidatePath(`/operations/${operationId}`);
    revalidatePath("/operations");
    if (operation?.sharedToken) {
      revalidatePath(`/shared/${operation.sharedToken}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteDocumentAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al eliminar documento.",
    };
  }
}
