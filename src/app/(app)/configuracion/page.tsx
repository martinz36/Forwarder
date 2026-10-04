import type { Metadata } from "next";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Facts, PageHeader, Panel, Section } from "@/components/ui";
import { BASIS, DIRECTION, GROUPS, MODE, TAX } from "@/lib/labels";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const { organization: org, role } = await requireTenant();
  const db = getDb();
  const [templates, concepts] = await Promise.all([
    db.quoteTemplate.findMany({
      where: { organizationId: org.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { lines: { orderBy: { sortOrder: "asc" }, include: { concept: true } } },
    }),
    db.chargeConcept.findMany({ where: { organizationId: org.id, isActive: true }, orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }),
  ]);
  const groupLabel = Object.fromEntries(GROUPS.map((g) => [g.group, g.label]));

  return (
    <>
      <PageHeader title="Configuración" meta={<span>Datos de la empresa, condiciones, cuentas para depósito y plantillas.</span>} />

      {role === "OWNER" || role === "ADMIN" ? (
        <div className="mt-6 rounded-md border border-rule bg-surface p-4 sm:p-6">
          <CompanyForm
            d={{
              legalName: org.legalName,
              name: org.name,
              taxId: org.taxId,
              address: org.address,
              phone: org.phone,
              email: org.email,
              website: org.website,
              quoteValidityDays: org.quoteValidityDays,
              defaultMarkupPct: org.defaultMarkupPct.toString(),
              quoteTerms: org.quoteTerms,
              paymentInstructions: org.paymentInstructions,
            }}
          />
        </div>
      ) : (
        <Section title="Empresa">
          <Facts
            items={[
              { label: "Razón social", value: org.legalName },
              { label: "Nombre comercial", value: org.name },
              { label: "RUC", value: org.taxId, mono: true },
              { label: "Validez de cotizaciones", value: `${org.quoteValidityDays} días` },
            ]}
          />
        </Section>
      )}

      <Section title="Plantillas de cotización" description="Los conceptos que se cargan solos según el tipo de servicio.">
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Panel key={t.id}>
              <div className="border-b border-rule px-4 py-3">
                <h3 className="font-semibold text-ink">{t.name}</h3>
                <p className="text-xs text-ink-3">
                  {DIRECTION[t.direction]} · {t.mode ? MODE[t.mode] : "cualquier modo"}
                  {t.incoterm ? ` · incoterm sugerido ${t.incoterm}` : ""}
                </p>
              </div>
              <ol className="divide-y divide-rule text-sm">
                {t.lines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className={l.isOptional ? "text-ink-3" : "text-ink"}>
                      {l.concept.name}
                      {l.isOptional && <span className="ml-1.5 text-xs">(opcional)</span>}
                    </span>
                    {l.incoterms.length > 0 && (
                      <span className="shrink-0 font-mono text-xs text-ink-3">solo {l.incoterms.join(" / ")}</span>
                    )}
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
        </div>
      </Section>

      <Section title="Conceptos de cobro" description={`${concepts.length} conceptos. Las tarifas por cliente se cargarán aparte.`}>
        <Panel>
          <ul className="divide-y divide-rule text-sm">
            {concepts.map((c) => (
              <li key={c.id} className="grid gap-x-4 gap-y-0.5 px-4 py-2 sm:grid-cols-[1fr_9rem_9rem_7rem] sm:items-center">
                <span className="text-ink">{c.name}</span>
                <span className="text-xs text-ink-3">{groupLabel[c.group]}</span>
                <span className="text-xs text-ink-3">{BASIS[c.defaultBasis] || "manual"}</span>
                <span>
                  <Badge tone={c.taxTreatment === "TAXED" ? "neutral" : "warn"}>{TAX[c.taxTreatment]}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </Section>
    </>
  );
}
