"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export interface CreateDocumentInput {
  operationId: string;
  name: string;
  fileUrl: string;
  documentType: "BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "LIQUIDACION" | "OTRO";
  uploadedBy: "BROKER" | "CLIENT";
}

export async function createDocumentAction(input: CreateDocumentInput) {
  if (!input.operationId || !input.name || !input.fileUrl) {
    throw new Error("Información del documento incompleta.");
  }

  const doc = await prisma.document.create({
    data: {
      operationId: input.operationId,
      name: input.name.trim(),
      fileUrl: input.fileUrl.trim(),
      documentType: input.documentType,
      uploadedBy: input.uploadedBy,
    },
  });

  const operation = await prisma.operation.findUnique({
    where: { id: input.operationId },
    select: { sharedToken: true },
  });

  revalidatePath(`/operations/${input.operationId}`);
  if (operation?.sharedToken) {
    revalidatePath(`/shared/${operation.sharedToken}`);
  }

  return doc;
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
  if (operation?.sharedToken) {
    revalidatePath(`/shared/${operation.sharedToken}`);
  }
}
