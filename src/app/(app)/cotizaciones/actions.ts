"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/server/db";
import { createNewVersion, respondQuote, saveDraft, sendVersion } from "@/server/quotes";
import { editorActor, oneOf, str, toActionError, type ActionState } from "@/server/action-utils";

const money = z.coerce.number().finite().min(0).max(100_000_000);
const optionalNumber = z
  .union([z.literal(""), z.null(), z.undefined(), z.coerce.number().finite().min(0)])
  .transform((v) => (v === "" || v === undefined ? null : v));
const optionalText = z
  .string()
  .max(5000)
  .nullish()
  .transform((v) => (v?.trim() ? v.trim() : null));
const optionalDate = z
  .string()
  .nullish()
  .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00-05:00`) : null));

const lineSchema = z.object({
  conceptId: z.string().nullish(),
  description: z.string().trim().min(1, "Cada línea necesita una descripción.").max(300),
  group: z.enum(["ORIGIN", "FREIGHT", "INSURANCE", "DESTINATION", "CUSTOMS", "INLAND_TRANSPORT", "STORAGE", "DUTIES_TAXES", "OTHER"]),
  taxTreatment: z.enum(["TAXED", "EXEMPT", "UNAFFECTED", "REIMBURSABLE"]),
  basis: z.enum([
    "PER_SHIPMENT", "PER_DOCUMENT", "PER_CONTAINER", "PER_WM", "PER_CBM", "PER_TON", "PER_KG",
    "PER_CHARGEABLE_KG", "PER_PACKAGE", "PER_DAY", "PERCENT_FOB", "PERCENT_CIF", "MANUAL",
  ]),
  quantity: z.coerce.number().finite().positive("La cantidad debe ser mayor a 0.").max(1_000_000),
  currency: z.enum(["USD", "PEN"]),
  unitCost: money,
  unitPrice: money,
  minPrice: optionalNumber,
  isOptional: z.boolean(),
  notes: optionalText,
});

const draftSchema = z.object({
  incoterm: optionalText,
  validUntil: optionalDate,
  originId: optionalText,
  originText: optionalText,
  destinationId: optionalText,
  destinationText: optionalText,
  carrierId: optionalText,
  routing: optionalText,
  frequency: optionalText,
  transitTime: optionalText,
  commodity: optionalText,
  packages: optionalNumber.transform((v) => (v === null ? null : Math.round(v))),
  packageType: optionalText,
  grossWeightKg: optionalNumber,
  volumeCbm: optionalNumber,
  cargoValue: optionalNumber,
  paymentTerms: optionalText,
  notes: optionalText,
  internalNotes: optionalText,
  lines: z.array(lineSchema).max(200),
});

export type DraftPayload = z.input<typeof draftSchema>;

export async function saveDraftAction(versionId: string, number: string, payload: DraftPayload): Promise<ActionState> {
  try {
    const parsed = draftSchema.safeParse(payload);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos de la cotización." };
    await saveDraft(getDb(), await editorActor(), versionId, parsed.data);
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/cotizaciones/${number}`);
  return { ok: "Borrador guardado" };
}

export async function sendVersionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const number = str(fd, "number") ?? "";
  try {
    await sendVersion(getDb(), await editorActor(), str(fd, "versionId") ?? "");
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/cotizaciones/${number}`);
  revalidatePath("/expedientes", "layout");
  return { ok: "Marcada como enviada" };
}

export async function newVersionAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const number = str(fd, "number") ?? "";
  try {
    await createNewVersion(getDb(), await editorActor(), str(fd, "quoteId") ?? "");
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/cotizaciones/${number}`);
  redirect(`/cotizaciones/${number}/editar`);
}

export async function respondQuoteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const number = str(fd, "number") ?? "";
  const decision = oneOf(fd, "decision", ["ACCEPTED", "REJECTED"] as const, "ACCEPTED");
  try {
    await respondQuote(getDb(), await editorActor(), str(fd, "quoteId") ?? "", decision, str(fd, "note"), {
      rateReconfirmed: fd.get("rateReconfirmed") === "on",
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/cotizaciones/${number}`);
  revalidatePath("/expedientes", "layout");
  return { ok: decision === "ACCEPTED" ? "Aceptada: el expediente pasó a operación" : "Registrada como no aceptada" };
}
