"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/server/db";
import { createExpediente, reopenExpediente, setMilestone, updateExpediente, type CargoInput } from "@/server/expedientes";
import { createQuote } from "@/server/quotes";
import { bool, date, editorActor, int, num, oneOf, str, toActionError, type ActionState } from "@/server/action-utils";
import type { EquipmentType, PartnerType } from "@/generated/prisma/enums";

const MODES = ["SEA_LCL", "SEA_FCL", "AIR", "ROAD"] as const;
const DIRECTIONS = ["IMPORT", "EXPORT"] as const;
const TAX_IDS = ["RUC", "DNI", "CE", "PASSPORT", "FOREIGN_TAX_ID", "OTHER"] as const;
const EQUIPMENT = [
  "DRY_20", "DRY_40", "HIGH_CUBE_40", "HIGH_CUBE_45", "REEFER_20", "REEFER_40",
  "OPEN_TOP_20", "OPEN_TOP_40", "FLAT_RACK_20", "FLAT_RACK_40",
] as const;

/** Contenedores del formulario: campos "cont_<TIPO>" con la cantidad. */
function containersFrom(fd: FormData): CargoInput["containers"] {
  return EQUIPMENT.map((equipment) => ({ equipment: equipment as EquipmentType, quantity: int(fd, `cont_${equipment}`) ?? 0 })).filter(
    (c) => c.quantity > 0,
  );
}

function cargoFrom(fd: FormData): CargoInput {
  return {
    commodity: str(fd, "commodity"),
    packages: int(fd, "packages"),
    packageType: str(fd, "packageType"),
    grossWeightKg: num(fd, "grossWeightKg"),
    volumeCbm: num(fd, "volumeCbm"),
    cargoValue: num(fd, "cargoValue"),
    containers: containersFrom(fd),
  };
}

export async function createExpedienteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let number: string;
  try {
    const actor = await editorActor();
    const mode = oneOf(fd, "mode", MODES, "SEA_LCL");
    const isNewClient = fd.get("clientMode") === "new";
    const shipment = await createExpediente(getDb(), actor, {
      clientId: isNewClient ? null : str(fd, "clientId"),
      newClient: isNewClient
        ? {
            taxIdType: oneOf(fd, "taxIdType", TAX_IDS, "RUC"),
            taxId: str(fd, "taxId") ?? "",
            legalName: str(fd, "legalName") ?? "",
            contactName: str(fd, "contactName"),
            email: str(fd, "email"),
            phone: str(fd, "phone"),
          }
        : null,
      direction: oneOf(fd, "direction", DIRECTIONS, "IMPORT"),
      mode,
      incoterm: str(fd, "incoterm"),
      originId: str(fd, "originId"),
      originText: str(fd, "originText"),
      destinationId: str(fd, "destinationId"),
      destinationText: str(fd, "destinationText"),
      includesFreight: bool(fd, "includesFreight"),
      includesCustoms: bool(fd, "includesCustoms"),
      includesInland: bool(fd, "includesInland"),
      includesInsurance: bool(fd, "includesInsurance"),
      clientReference: str(fd, "clientReference"),
      notes: str(fd, "notes"),
      ...cargoFrom(fd),
      containers: mode === "SEA_FCL" ? containersFrom(fd) : [],
    });
    number = shipment.number;
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/expedientes");
  redirect(`/expedientes/${number}`);
}

/** Busca o crea un proveedor por nombre (para elegir naviera/agente o escribir uno nuevo). */
async function partnerId(organizationId: string, fd: FormData, key: string, type: PartnerType) {
  const selected = str(fd, key);
  const typed = str(fd, `${key}New`);
  if (typed) {
    const p = await getDb().partner.upsert({
      where: { organizationId_type_name: { organizationId, type, name: typed } },
      create: { organizationId, type, name: typed },
      update: {},
    });
    return p.id;
  }
  return selected;
}

export async function updateExpedienteAction(shipmentId: string, number: string, _: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await editorActor();
    const mode = str(fd, "mode");
    const channel = str(fd, "channel");
    await updateExpediente(getDb(), actor, shipmentId, {
      incoterm: str(fd, "incoterm"),
      originId: str(fd, "originId"),
      destinationId: str(fd, "destinationId"),
      carrierId: await partnerId(actor.organizationId, fd, "carrierId", mode === "AIR" ? "AIRLINE" : "CARRIER"),
      agentId: await partnerId(actor.organizationId, fd, "agentId", "AGENT"),
      warehouseId: await partnerId(actor.organizationId, fd, "warehouseId", "WAREHOUSE"),
      clientReference: str(fd, "clientReference"),
      bookingNumber: str(fd, "bookingNumber"),
      mblNumber: str(fd, "mblNumber"),
      hblNumber: str(fd, "hblNumber"),
      vessel: str(fd, "vessel"),
      voyage: str(fd, "voyage"),
      flightNumber: str(fd, "flightNumber"),
      etd: date(fd, "etd"),
      eta: date(fd, "eta"),
      atd: date(fd, "atd"),
      ata: date(fd, "ata"),
      freeDays: int(fd, "freeDays"),
      internalNotes: str(fd, "internalNotes"),
      ...cargoFrom(fd),
      containers: mode === "SEA_FCL" ? containersFrom(fd) : undefined,
      customs: {
        regime: oneOf(fd, "regime", ["IMPORT_FOR_CONSUMPTION", "EXPORT_DEFINITIVE", "TEMPORARY_ADMISSION", "TEMPORARY_EXPORT", "CUSTOMS_WAREHOUSE", "TRANSIT", "OTHER"] as const, "IMPORT_FOR_CONSUMPTION"),
        declarationNumber: str(fd, "declarationNumber"),
        channel: channel === "GREEN" || channel === "ORANGE" || channel === "RED" ? channel : null,
        releasedAt: date(fd, "releasedAt"),
      },
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/expedientes/${number}`);
  redirect(`/expedientes/${number}`);
}

export async function setMilestoneAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const actor = await editorActor();
    await setMilestone(getDb(), actor, str(fd, "milestoneId") ?? "", {
      status: oneOf(fd, "status", ["DONE", "SKIPPED", "PENDING"] as const, "DONE"),
      completedAt: date(fd, "completedAt"),
      note: str(fd, "note"),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/expedientes/${str(fd, "number")}`);
  return { ok: "Guardado" };
}

export async function createQuoteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let number: string;
  try {
    const actor = await editorActor();
    const quote = await createQuote(getDb(), actor, str(fd, "shipmentId") ?? "", str(fd, "templateId"));
    number = quote.number;
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${number}/editar`);
}

export async function reopenExpedienteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await reopenExpediente(getDb(), await editorActor(), str(fd, "shipmentId") ?? "");
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/expedientes/${str(fd, "number")}`);
  return { ok: "Expediente reabierto" };
}
