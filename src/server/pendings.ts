import type { Db } from "@/server/db";
import type { CustomsChannel, ShipmentStatus } from "@/generated/prisma/enums";
import { computeBalance } from "@/server/billing";
import { computeTotals } from "@/lib/pricing/totals";

export type PendingKind =
  | "request_unquoted"
  | "quote_expiring"
  | "quote_expired"
  | "arrival_notice_missing"
  | "deposit_missing"
  | "customs_inspection"
  | "free_days"
  | "client_documents"
  | "balance_after_delivery";

export interface Pending {
  kind: PendingKind;
  urgent: boolean;
  href: string;
  reference: string; // L-2026-0006 o COT-2026-0005
  client: string;
  text: string;
  date: Date; // para ordenar
}

const DAY = 86_400_000;
const days = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / DAY);
// Sin año, es-PE escribe «30-set.»; se arma «30 set.» como en el resto del sistema.
const dayMonth = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", timeZone: "America/Lima" });
const fmt = (d: Date) => {
  const parts = dayMonth.formatToParts(d);
  return `${parts.find((p) => p.type === "day")?.value} ${parts.find((p) => p.type === "month")?.value}`;
};

const IN_PROGRESS: ShipmentStatus[] = ["CONFIRMED", "AT_ORIGIN", "IN_TRANSIT", "AT_DESTINATION", "CUSTOMS_CLEARANCE", "RELEASED", "OUT_FOR_DELIVERY"];
const BEFORE_ARRIVAL: ShipmentStatus[] = ["CONFIRMED", "AT_ORIGIN", "IN_TRANSIT"];

export interface PendingInput {
  shipments: {
    number: string;
    status: ShipmentStatus;
    client: string;
    createdAt: Date;
    includesFreight: boolean;
    mode: string;
    eta: Date | null;
    ata: Date | null;
    freeDays: number | null;
    quotesCount: number;
    channel: CustomsChannel | null;
    releasedAt: Date | null;
    containersToReturn: number;
    arrivalNotice: { number: string; issuedAt: Date } | null;
    paymentsCount: number;
    pendingClientDocs: string[];
    balanceDue: { currency: string; balance: string }[];
  }[];
  quotes: { number: string; client: string; validUntil: Date | null; shipmentNumber: string | null }[]; // enviadas sin respuesta
}

/** Reglas de lo que requiere acción hoy. Pura: recibe datos y la fecha actual. */
export function buildPendings(input: PendingInput, now: Date): Pending[] {
  const out: Pending[] = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (const s of input.shipments) {
    const href = `/expedientes/${s.number}`;
    const base = { href, reference: s.number, client: s.client };

    if (s.status === "QUOTING" && s.quotesCount === 0 && days(s.createdAt, now) >= 1) {
      out.push({ ...base, kind: "request_unquoted", urgent: days(s.createdAt, now) >= 3, text: `Solicitud sin cotizar desde el ${fmt(s.createdAt)}`, date: s.createdAt });
    }

    if (BEFORE_ARRIVAL.includes(s.status) && s.includesFreight && s.eta && !s.arrivalNotice) {
      const left = days(today, s.eta);
      if (left <= 7) {
        out.push({ ...base, kind: "arrival_notice_missing", urgent: left <= 3, text: left < 0 ? `ETA ${fmt(s.eta)} ya pasó y no se emitió aviso de llegada` : `Llega el ${fmt(s.eta)}: falta emitir el aviso de llegada`, date: s.eta });
      }
    }

    if (s.arrivalNotice && s.paymentsCount === 0 && IN_PROGRESS.includes(s.status) && days(s.arrivalNotice.issuedAt, now) >= 2) {
      out.push({ ...base, kind: "deposit_missing", urgent: days(s.arrivalNotice.issuedAt, now) >= 5, text: `Aviso ${s.arrivalNotice.number} sin depósito desde el ${fmt(s.arrivalNotice.issuedAt)}`, date: s.arrivalNotice.issuedAt });
    }

    if ((s.channel === "RED" || s.channel === "ORANGE") && !s.releasedAt && IN_PROGRESS.includes(s.status)) {
      out.push({ ...base, kind: "customs_inspection", urgent: true, text: `Canal ${s.channel === "RED" ? "rojo" : "naranja"}: pendiente revisión y levante`, date: now });
    }

    if (s.ata && s.freeDays !== null && s.containersToReturn > 0) {
      const left = s.freeDays - days(s.ata, now);
      if (left <= 3) {
        out.push({ ...base, kind: "free_days", urgent: left <= 1, text: left < 0 ? `Sobrestadía: días libres vencidos hace ${-left} día(s) (${s.containersToReturn} contenedor/es sin devolver)` : `Quedan ${left} día(s) libres para devolver ${s.containersToReturn} contenedor/es`, date: now });
      }
    }

    if (BEFORE_ARRIVAL.includes(s.status) && s.eta && s.pendingClientDocs.length && days(today, s.eta) <= 5) {
      out.push({ ...base, kind: "client_documents", urgent: days(today, s.eta) <= 2, text: `Faltan documentos del cliente: ${s.pendingClientDocs.join(", ")}`, date: s.eta });
    }

    const due = s.balanceDue.filter((b) => Number(b.balance) > 0);
    if (s.status === "DELIVERED" && due.length) {
      out.push({ ...base, kind: "balance_after_delivery", urgent: false, text: `Entregado con saldo por cobrar (${due.map((b) => `${b.currency} ${b.balance}`).join(" + ")})`, date: now });
    }
  }

  for (const q of input.quotes) {
    if (!q.validUntil) continue;
    const left = days(today, q.validUntil);
    const href = `/cotizaciones/${q.number}`;
    if (left < 0) {
      out.push({ kind: "quote_expired", urgent: false, href, reference: q.number, client: q.client, text: `Cotización vencida el ${fmt(q.validUntil)} sin respuesta del cliente`, date: q.validUntil });
    } else if (left <= 2) {
      out.push({ kind: "quote_expiring", urgent: left === 0, href, reference: q.number, client: q.client, text: left === 0 ? "Cotización vence hoy, sin respuesta" : `Cotización vence el ${fmt(q.validUntil)}, sin respuesta`, date: q.validUntil });
    }
  }

  return out.sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.date.getTime() - b.date.getTime());
}

/** Carga los datos de la empresa y arma la lista de pendientes. */
export async function getPendings(db: Db, organizationId: string, now = new Date()): Promise<Pending[]> {
  const [org, shipments, quotes] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { taxRate: true } }),
    db.shipment.findMany({
      where: { organizationId, status: { notIn: ["CLOSED", "LOST", "CANCELLED"] } },
      include: {
        client: { select: { legalName: true } },
        customsEntries: { select: { channel: true, releasedAt: true }, take: 1 },
        containers: { where: { emptyReturnedAt: null }, select: { id: true } },
        statements: { where: { type: "ARRIVAL_NOTICE", status: "ISSUED" }, select: { number: true, issuedAt: true }, take: 1 },
        requirements: { where: { status: "PENDING", responsible: "CLIENT" }, select: { title: true } },
        charges: { select: { currency: true, taxTreatment: true, totalPrice: true, totalCost: true } },
        payments: { select: { currency: true, amount: true } },
        _count: { select: { quotes: true } },
      },
    }),
    db.quote.findMany({
      where: { organizationId, status: "SENT" },
      include: {
        client: { select: { legalName: true } },
        shipment: { select: { number: true } },
        versions: { where: { status: "SENT" }, orderBy: { versionNo: "desc" }, take: 1, select: { validUntil: true } },
      },
    }),
  ]);

  return buildPendings(
    {
      shipments: shipments.map((s) => ({
        number: s.number,
        status: s.status,
        client: s.client.legalName,
        createdAt: s.createdAt,
        includesFreight: s.includesFreight,
        mode: s.mode,
        eta: s.eta,
        ata: s.ata,
        freeDays: s.freeDays,
        quotesCount: s._count.quotes,
        channel: s.customsEntries[0]?.channel ?? null,
        releasedAt: s.customsEntries[0]?.releasedAt ?? null,
        containersToReturn: s.mode === "SEA_FCL" ? s.containers.length : 0,
        arrivalNotice: s.statements[0] ?? null,
        paymentsCount: s.payments.length,
        pendingClientDocs: s.requirements.map((r) => r.title),
        balanceDue: s.status === "DELIVERED" ? computeBalance(computeTotals(s.charges, org.taxRate.toString()), s.payments) : [],
      })),
      quotes: quotes.map((q) => ({
        number: q.number,
        client: q.client.legalName,
        validUntil: q.versions[0]?.validUntil ?? null,
        shipmentNumber: q.shipment?.number ?? null,
      })),
    },
    now,
  );
}
