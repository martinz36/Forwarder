import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { Code, PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/catalog";
import { EditExpedienteForm } from "./edit-form";

export const metadata: Metadata = { title: "Editar expediente" };

export default async function EditExpedientePage({ params }: { params: Promise<{ number: string }> }) {
  const number = decodeURIComponent((await params).number);
  const { organization, role } = await requireTenant();
  if (!canEdit(role)) redirect(`/expedientes/${number}`);
  const db = getDb();
  const s = await db.shipment.findUnique({
    where: { organizationId_number: { organizationId: organization.id, number } },
    include: { client: true, containers: true, customsEntries: true },
  });
  if (!s) notFound();

  const [locations, partners] = await Promise.all([
    db.location.findMany({ where: { organizationId: organization.id }, orderBy: [{ country: "asc" }, { name: "asc" }] }),
    db.partner.findMany({ where: { organizationId: organization.id, isActive: true }, orderBy: { name: "asc" } }),
  ]);
  const byType = (...types: string[]) => partners.filter((p) => types.includes(p.type)).map((p) => ({ value: p.id, label: p.name }));
  const customs = s.customsEntries[0];
  const dec = (v: { toString(): string } | null) => (v === null ? null : v.toString());

  return (
    <>
      <PageHeader eyebrow={s.client.legalName} title={<>Editar <Code>{s.number}</Code></>} />
      <div className="mt-6 rounded-md border border-rule bg-surface p-4 sm:p-6">
        <EditExpedienteForm
          shipmentId={s.id}
          number={s.number}
          locations={locations.map((l) => ({ value: l.id, label: `${l.name} (${l.code})` }))}
          carriers={byType(s.mode === "AIR" ? "AIRLINE" : "CARRIER", "COLOADER")}
          agents={byType("AGENT", "COLOADER")}
          warehouses={byType("WAREHOUSE")}
          d={{
            mode: s.mode,
            incoterm: s.incoterm,
            originId: s.originId,
            destinationId: s.destinationId,
            carrierId: s.carrierId,
            agentId: s.agentId,
            warehouseId: s.warehouseId,
            clientReference: s.clientReference,
            bookingNumber: s.bookingNumber,
            mblNumber: s.mblNumber,
            hblNumber: s.hblNumber,
            vessel: s.vessel,
            voyage: s.voyage,
            flightNumber: s.flightNumber,
            etd: toDateInput(s.etd),
            eta: toDateInput(s.eta),
            atd: toDateInput(s.atd),
            ata: toDateInput(s.ata),
            freeDays: s.freeDays,
            commodity: s.commodity,
            packages: s.packages,
            packageType: s.packageType,
            grossWeightKg: dec(s.grossWeightKg),
            volumeCbm: dec(s.volumeCbm),
            cargoValue: dec(s.cargoValue),
            containers: s.containers.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.equipment]: (acc[c.equipment] ?? 0) + 1 }), {}),
            internalNotes: s.internalNotes,
            regime: customs?.regime ?? (s.direction === "EXPORT" ? "EXPORT_DEFINITIVE" : "IMPORT_FOR_CONSUMPTION"),
            declarationNumber: customs?.declarationNumber ?? null,
            channel: customs?.channel ?? null,
            releasedAt: toDateInput(customs?.releasedAt),
          }}
        />
      </div>
    </>
  );
}
