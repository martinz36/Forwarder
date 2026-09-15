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
}

export async function createDocumentAction(input: CreateDocumentInput) {
  if (!input.operationId || !input.name || !input.fileUrl) {
    throw new Error("Información del documento incompleta.");
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

  return doc;
}

export async function toggleDocumentDraftStatusAction(documentId: string, operationId: string, isDraft: boolean) {
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
}

export async function deleteDocumentAction(documentId: string, operationId: string) {
  await prisma.document.delete({
    where: { id: documentId },
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
}
