import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { PageHeader } from "@/components/ui";
import { NewExpedienteForm } from "./new-expediente-form";

export const metadata: Metadata = { title: "Nueva solicitud" };

export default async function NewExpedientePage() {
  const { organization, role } = await requireTenant();
  if (!canEdit(role)) redirect("/expedientes");
  const db = getDb();
  const [clients, locations] = await Promise.all([
    db.client.findMany({ where: { organizationId: organization.id, status: { not: "INACTIVE" } }, orderBy: { legalName: "asc" } }),
    db.location.findMany({ where: { organizationId: organization.id }, orderBy: [{ country: "asc" }, { name: "asc" }] }),
  ]);
  const callao = locations.find((l) => l.code === "PECLL");

  return (
    <>
      <PageHeader
        eyebrow="Expedientes"
        title="Nueva solicitud"
        meta={<span>Se abre el expediente con su número de referencia; luego armas la cotización dentro de él.</span>}
      />
      <div className="mt-6 rounded-md border border-rule bg-surface p-4 sm:p-6">
        <NewExpedienteForm
          clients={clients.map((c) => ({ value: c.id, label: `${c.legalName}${c.taxId ? ` · ${c.taxId}` : ""}` }))}
          locations={locations.map((l) => ({ value: l.id, label: `${l.name} (${l.code})` }))}
          defaultDestinationId={callao?.id}
        />
      </div>
    </>
  );
}
