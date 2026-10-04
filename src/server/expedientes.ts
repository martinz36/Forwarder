import type { Db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CustomsChannel,
  CustomsRegime,
  Direction,
  EquipmentType,
  ServiceMode,
  ShipmentStatus,
  TaxIdType,
} from "@/generated/prisma/enums";
import { nextShipmentNumber } from "@/server/sequences";
import { applicableMilestones, applicableRequirements, STATUS_RANK } from "@/server/shipments/plan";

type Tx = Prisma.TransactionClient;

/** Quién hace la operación. Toda función filtra por `organizationId`. */
export interface Actor {
  organizationId: string;
  userId: string | null;
}

export class DomainError extends Error {}

export interface NewClientInput {
  taxIdType: TaxIdType;
  taxId: string;
  legalName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface CargoInput {
  commodity?: string | null;
  packages?: number | null;
  packageType?: string | null;
  grossWeightKg?: number | null;
  volumeCbm?: number | null;
  cargoValue?: number | null;
  containers?: { equipment: EquipmentType; quantity: number }[];
}

export interface NewExpedienteInput extends CargoInput {
  clientId?: string | null;
  newClient?: NewClientInput | null;
  direction: Direction;
  mode: ServiceMode;
  incoterm?: string | null;
  originId?: string | null;
  originText?: string | null;
  destinationId?: string | null;
  destinationText?: string | null;
  includesFreight: boolean;
  includesCustoms: boolean;
  includesInland: boolean;
  includesInsurance: boolean;
  clientReference?: string | null;
  notes?: string | null;
}

async function resolveClient(tx: Tx, actor: Actor, input: NewExpedienteInput): Promise<string> {
  if (input.clientId) {
    const client = await tx.client.findFirst({ where: { id: input.clientId, organizationId: actor.organizationId } });
    if (!client) throw new DomainError("El cliente no existe.");
    return client.id;
  }
  const nc = input.newClient;
  if (!nc?.legalName.trim()) throw new DomainError("Elige un cliente o registra uno nuevo.");
  const taxId = nc.taxId.replace(/\s+/g, "") || null;
  if (taxId) {
    const existing = await tx.client.findUnique({
      where: { organizationId_taxIdType_taxId: { organizationId: actor.organizationId, taxIdType: nc.taxIdType, taxId } },
    });
    if (existing) return existing.id;
  }
  const client = await tx.client.create({
    data: {
      organizationId: actor.organizationId,
      taxIdType: nc.taxIdType,
      taxId,
      legalName: nc.legalName.trim(),
      email: nc.email?.trim() || null,
      phone: nc.phone?.trim() || null,
      status: "PROSPECT",
    },
  });
  if (nc.contactName?.trim() || nc.email?.trim() || nc.phone?.trim()) {
    await tx.contact.create({
      data: {
        organizationId: actor.organizationId,
        clientId: client.id,
        name: nc.contactName?.trim() || client.legalName,
        email: nc.email?.trim() || null,
        phone: nc.phone?.trim() || null,
        isPrimary: true,
      },
    });
  }
  return client.id;
}

const containerRows = (organizationId: string, containers: CargoInput["containers"]) =>
  (containers ?? []).flatMap((c) => Array.from({ length: Math.max(0, c.quantity) }, () => ({ organizationId, equipment: c.equipment })));

/** Abre un expediente con la solicitud del cliente. Nace en "En cotización". */
export async function createExpediente(db: Db, actor: Actor, input: NewExpedienteInput) {
  return db.$transaction(async (tx) => {
    const clientId = await resolveClient(tx, actor, input);
    const contact = await tx.contact.findFirst({ where: { clientId, isPrimary: true } });
    const number = await nextShipmentNumber(tx, actor.organizationId, input.mode);
    const now = new Date();

    const shipment = await tx.shipment.create({
      data: {
        organizationId: actor.organizationId,
        number,
        clientId,
        contactId: contact?.id,
        clientReference: input.clientReference?.trim() || null,
        status: "QUOTING",
        statusChangedAt: now,
        direction: input.direction,
        mode: input.mode,
        incoterm: input.incoterm || null,
        includesFreight: input.includesFreight,
        includesCustoms: input.includesCustoms,
        includesInland: input.includesInland,
        includesInsurance: input.includesInsurance,
        originId: input.originId || null,
        destinationId: input.destinationId || null,
        pickupAddress: input.originId ? null : input.originText?.trim() || null,
        deliveryAddress: input.destinationId ? null : input.destinationText?.trim() || null,
        commodity: input.commodity?.trim() || null,
        packages: input.packages ?? null,
        packageType: input.packageType?.trim() || null,
        grossWeightKg: input.grossWeightKg ?? null,
        volumeCbm: input.volumeCbm ?? null,
        cargoValue: input.cargoValue ?? null,
        internalNotes: input.notes?.trim() || null,
        createdById: actor.userId,
        containers: { create: containerRows(actor.organizationId, input.containers) },
      },
    });

    const defs = await tx.milestoneDefinition.findMany({ where: { organizationId: actor.organizationId } });
    const quotingDefs = applicableMilestones(defs, shipment, "QUOTING");
    await tx.shipmentMilestone.createMany({
      data: quotingDefs.map((d) => ({
        organizationId: actor.organizationId,
        shipmentId: shipment.id,
        definitionId: d.id,
        name: d.name,
        clientLabel: d.clientLabel,
        setsStatus: d.setsStatus,
        clientVisible: d.clientVisible,
        notifyClient: d.notifyClient,
        sortOrder: d.sortOrder,
        ...(d.code === "REQUEST_RECEIVED" ? { status: "DONE" as const, completedAt: now, completedById: actor.userId } : {}),
      })),
    });

    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId,
        shipmentId: shipment.id,
        type: "shipment.created",
        title: `Solicitud registrada · ${number}`,
        actorUserId: actor.userId,
      },
    });
    return shipment;
  });
}

export interface ExpedienteUpdateInput extends CargoInput {
  incoterm?: string | null;
  originId?: string | null;
  destinationId?: string | null;
  carrierId?: string | null;
  agentId?: string | null;
  warehouseId?: string | null;
  clientReference?: string | null;
  bookingNumber?: string | null;
  mblNumber?: string | null;
  hblNumber?: string | null;
  vessel?: string | null;
  voyage?: string | null;
  flightNumber?: string | null;
  etd?: Date | null;
  eta?: Date | null;
  atd?: Date | null;
  ata?: Date | null;
  freeDays?: number | null;
  internalNotes?: string | null;
  customs?: {
    regime: CustomsRegime;
    declarationNumber?: string | null;
    channel?: CustomsChannel | null;
    releasedAt?: Date | null;
  } | null;
}

/** Datos operativos del expediente (BL, nave, fechas, aduana…). */
export async function updateExpediente(db: Db, actor: Actor, shipmentId: string, input: ExpedienteUpdateInput) {
  return db.$transaction(async (tx) => {
    const shipment = await tx.shipment.findFirst({
      where: { id: shipmentId, organizationId: actor.organizationId },
      include: { customsEntries: true },
    });
    if (!shipment) throw new DomainError("El expediente no existe.");

    const { customs, containers, ...fields } = input;
    const clean = Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
    ) as typeof fields;

    await tx.shipment.update({ where: { id: shipment.id }, data: clean });

    if (containers) {
      await tx.shipmentContainer.deleteMany({ where: { shipmentId: shipment.id, number: null } });
      const kept = await tx.shipmentContainer.count({ where: { shipmentId: shipment.id } });
      if (kept === 0) {
        await tx.shipmentContainer.createMany({
          data: containerRows(actor.organizationId, containers).map((c) => ({ ...c, shipmentId: shipment.id })),
        });
      }
    }

    const existing = shipment.customsEntries[0];
    if (customs && (existing || customs.declarationNumber || customs.channel || customs.releasedAt)) {
      const data = {
        regime: customs.regime,
        declarationNumber: customs.declarationNumber?.trim() || null,
        channel: customs.channel ?? null,
        releasedAt: customs.releasedAt ?? null,
        ...(customs.channel && customs.channel !== existing?.channel ? { channelAt: new Date() } : {}),
      };
      if (existing) await tx.customsEntry.update({ where: { id: existing.id }, data });
      else await tx.customsEntry.create({ data: { ...data, organizationId: actor.organizationId, shipmentId: shipment.id } });
    }

    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId: shipment.id,
        type: "shipment.updated",
        title: "Datos del expediente actualizados",
        actorUserId: actor.userId,
      },
    });
  });
}

/** Estado según el hito cumplido más avanzado que mueve estado. */
async function recomputeStatus(tx: Tx, shipmentId: string, current: ShipmentStatus) {
  if (current === "LOST" || current === "CANCELLED") return current;
  const done = await tx.shipmentMilestone.findMany({
    where: { shipmentId, status: "DONE", setsStatus: { not: null } },
    select: { setsStatus: true },
  });
  const best = done
    .map((m) => m.setsStatus!)
    .reduce<ShipmentStatus | null>((acc, s) => (acc === null || STATUS_RANK[s] > STATUS_RANK[acc] ? s : acc), null);
  return best ?? current;
}

/** Cambia un hito: cumplido (con fecha), no aplica o pendiente. Mueve el estado y deja historial. */
export async function setMilestone(
  db: Db,
  actor: Actor,
  milestoneId: string,
  input: { status: "DONE" | "SKIPPED" | "PENDING"; completedAt?: Date | null; note?: string | null },
) {
  return db.$transaction(async (tx) => {
    const milestone = await tx.shipmentMilestone.findFirst({
      where: { id: milestoneId, organizationId: actor.organizationId },
      include: { shipment: { include: { client: { include: { contacts: true } } } } },
    });
    if (!milestone) throw new DomainError("El hito no existe.");
    const shipment = milestone.shipment;

    await tx.shipmentMilestone.update({
      where: { id: milestone.id },
      data: {
        status: input.status,
        completedAt: input.status === "DONE" ? input.completedAt ?? new Date() : null,
        completedById: input.status === "PENDING" ? null : actor.userId,
        note: input.note?.trim() || (input.status === "PENDING" ? null : milestone.note),
      },
    });

    const status = await recomputeStatus(tx, shipment.id, shipment.status);
    if (status !== shipment.status) {
      await tx.shipment.update({ where: { id: shipment.id }, data: { status, statusChangedAt: new Date() } });
    }

    if (input.status === "DONE") {
      const event = await tx.activityEvent.create({
        data: {
          organizationId: actor.organizationId,
          clientId: shipment.clientId,
          shipmentId: shipment.id,
          type: "milestone.completed",
          title: milestone.clientVisible ? milestone.clientLabel : milestone.name,
          body: input.note?.trim() || null,
          visibility: milestone.clientVisible ? "CLIENT" : "INTERNAL",
          actorUserId: actor.userId,
          data: { milestoneId: milestone.id, status },
        },
      });
      // Aviso al cliente: queda en cola; el envío por correo se conecta en la fase del portal.
      if (milestone.notifyClient && milestone.clientVisible) {
        const recipients = shipment.client.contacts.filter((c) => c.notifyEmail && c.email);
        if (recipients.length) {
          await tx.notificationOutbox.createMany({
            data: recipients.map((c) => ({
              organizationId: actor.organizationId,
              eventId: event.id,
              channel: "EMAIL" as const,
              recipient: c.email!,
              contactId: c.id,
              subject: `[${shipment.number}] ${milestone.clientLabel}`,
              template: "milestone",
              payload: { shipmentNumber: shipment.number, label: milestone.clientLabel, note: input.note ?? null },
            })),
          });
        }
      }
    }
    return status;
  });
}

/** Crea los hitos operativos y el checklist cuando el cliente acepta (si aún no existen). */
export async function planOperation(tx: Tx, organizationId: string, shipmentId: string, userId: string | null) {
  const shipment = await tx.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: { milestones: { select: { definitionId: true } }, requirements: { select: { id: true } } },
  });
  const have = new Set(shipment.milestones.map((m) => m.definitionId));
  const defs = await tx.milestoneDefinition.findMany({ where: { organizationId } });
  const now = new Date();
  const toCreate = applicableMilestones(defs, shipment, "OPERATION").filter((d) => !have.has(d.id));
  await tx.shipmentMilestone.createMany({
    data: toCreate.map((d) => ({
      organizationId,
      shipmentId,
      definitionId: d.id,
      name: d.name,
      clientLabel: d.clientLabel,
      setsStatus: d.setsStatus,
      clientVisible: d.clientVisible,
      notifyClient: d.notifyClient,
      sortOrder: d.sortOrder,
      ...(d.code === "ORDER_CONFIRMED" ? { status: "DONE" as const, completedAt: now, completedById: userId } : {}),
    })),
  });

  if (shipment.requirements.length === 0) {
    const types = await tx.documentType.findMany({ where: { organizationId } });
    await tx.documentRequirement.createMany({
      data: applicableRequirements(types, shipment).map((t) => ({
        organizationId,
        shipmentId,
        typeId: t.id,
        title: t.name,
        responsible: t.defaultResponsible,
        sortOrder: t.sortOrder,
      })),
    });
  }
}

/** Vuelve a "En cotización" un expediente no concretado (el cliente regresó). */
export async function reopenExpediente(db: Db, actor: Actor, shipmentId: string) {
  return db.$transaction(async (tx) => {
    const shipment = await tx.shipment.findFirst({ where: { id: shipmentId, organizationId: actor.organizationId } });
    if (!shipment) throw new DomainError("El expediente no existe.");
    if (shipment.status !== "LOST") throw new DomainError("Solo se reabre un expediente no concretado.");
    await tx.shipment.update({ where: { id: shipment.id }, data: { status: "QUOTING", statusChangedAt: new Date() } });
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId: shipment.id,
        type: "shipment.reopened",
        title: "Expediente reabierto",
        actorUserId: actor.userId,
      },
    });
  });
}
