import { renderToBuffer } from "@react-pdf/renderer";
import type { Db } from "@/server/db";
import type { StatementType } from "@/generated/prisma/enums";
import { StatementPdf } from "@/components/pdf/statement-pdf";
import type { QuotePdfLine } from "@/components/pdf/quote-pdf";
import { GROUPS, TAX } from "@/lib/labels";
import { formatDate, formatMoney, formatVolume, formatWeight } from "@/lib/format";
import { describeLine } from "@/lib/pricing/display";
import type { Totals } from "@/lib/pricing/totals";
import type { BalanceRow, StatementLine } from "@/server/billing";

export const STATEMENT_TITLE: Record<StatementType, string> = {
  ARRIVAL_NOTICE: "AVISO DE LLEGADA",
  CUSTOMS_SETTLEMENT: "LIQUIDACIÓN DE ADUANAS",
  FINAL_SETTLEMENT: "LIQUIDACIÓN FINAL",
  REIMBURSEMENT_RECEIPT: "RECIBO DE REEMBOLSO",
};

const INTRO: Record<StatementType, string | null> = {
  ARRIVAL_NOTICE:
    "Su carga está próxima a arribar. Para iniciar los trámites de retiro, le agradeceremos realizar el depósito de los siguientes gastos de la agencia de carga.",
  CUSTOMS_SETTLEMENT: "Detalle de los gastos de despacho aduanero, almacenaje y transporte de su importación.",
  FINAL_SETTLEMENT: "Resumen de todos los gastos de su operación y de los depósitos recibidos.",
  REIMBURSEMENT_RECEIPT: "Gastos pagados por cuenta del cliente, que se reembolsan contra los comprobantes de terceros. No están afectos al IGV.",
};

const CHANNEL = { GREEN: "Verde", ORANGE: "Naranja", RED: "Rojo" } as const;

export async function renderStatementPdf(db: Db, organizationId: string, number: string) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const st = await db.statement.findUnique({
    where: { organizationId_number: { organizationId, number } },
    include: {
      shipment: {
        include: { client: true, contact: true, origin: true, destination: true, carrier: true, customsEntries: true },
      },
    },
  });
  if (!st) return null;
  const sh = st.shipment;
  const customs = sh.customsEntries[0];
  const lines = st.lines as unknown as StatementLine[];

  const toLine = (l: StatementLine): QuotePdfLine => {
    const shown = describeLine({ ...l, isOptional: false });
    return {
      description: l.description,
      group: l.group,
      sectionLabel: "",
      taxLabel: `${TAX[l.taxTreatment]}${l.source !== "QUOTE" ? " · adicional / ajuste" : ""}`,
      isTaxed: l.taxTreatment === "TAXED",
      quantity: shown.quantity,
      basisLabel: "",
      unitPrice: shown.unitPrice,
      total: shown.total,
      isOptional: false,
    };
  };

  const place = (loc: { name: string; code: string } | null, text: string | null) => (loc ? `${loc.name} (${loc.code})` : text);
  const facts = [
    { label: sh.mode === "AIR" ? "HAWB" : "BL / HBL", value: sh.hblNumber },
    { label: sh.mode === "AIR" ? "Vuelo" : "Nave / viaje", value: sh.mode === "AIR" ? sh.flightNumber : [sh.vessel, sh.voyage].filter(Boolean).join(" · ") },
    { label: sh.mode === "AIR" ? "Aerolínea" : "Naviera", value: sh.carrier?.name },
    { label: "ETA", value: sh.eta ? formatDate(sh.eta) : null },
    { label: "Origen", value: place(sh.origin, sh.pickupAddress) },
    { label: "Destino", value: place(sh.destination, sh.deliveryAddress) },
    { label: "Mercadería", value: sh.commodity },
    { label: "Bultos", value: sh.packages ? `${sh.packages} ${sh.packageType ?? ""}`.trim() : null },
    { label: "Peso", value: formatWeight(sh.grossWeightKg) },
    { label: "Volumen", value: formatVolume(sh.volumeCbm) },
    { label: "DAM", value: customs?.declarationNumber },
    { label: "Canal", value: customs?.channel ? CHANNEL[customs.channel] : null },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const balance = (st.balance as unknown as BalanceRow[] | null) ?? null;
  const owes = balance?.some((b) => Number(b.balance) > 0) ?? false;
  const showInstructions = st.type === "ARRIVAL_NOTICE" || st.type === "CUSTOMS_SETTLEMENT" || (st.type === "FINAL_SETTLEMENT" && owes);

  const buffer = await renderToBuffer(
    <StatementPdf
      d={{
        title: STATEMENT_TITLE[st.type],
        intro: INTRO[st.type],
        void: st.status === "VOID",
        company: {
          name: org.name,
          legalName: org.legalName,
          taxId: org.taxId,
          address: org.address,
          phone: org.phone,
          email: org.email,
          website: org.website,
        },
        number: st.number,
        meta: [`Emitido ${formatDate(st.issuedAt)}`, `Expediente ${sh.number}`, ...(sh.clientReference ? [`Ref. cliente ${sh.clientReference}`] : [])],
        client: {
          legalName: sh.client.legalName,
          taxId: sh.client.taxId,
          taxIdType: sh.client.taxIdType,
          contact: sh.contact?.name ?? null,
          email: sh.contact?.email ?? sh.client.email,
          phone: sh.contact?.phone ?? sh.client.phone,
        },
        facts,
        sections: GROUPS.map((g) => ({ label: g.label, lines: lines.filter((l) => l.group === g.group).map(toLine) })).filter((x) => x.lines.length),
        totals: st.totals as unknown as Totals,
        taxRate: org.taxRate.toString(),
        payments: st.payments
          ? (st.payments as { paidAt: string; amount: string; currency: string; bank: string | null; reference: string | null }[]).map((p) => ({
              date: formatDate(p.paidAt),
              detail: [p.bank, p.reference ? `op. ${p.reference}` : null].filter(Boolean).join(" · ") || "Depósito",
              amount: formatMoney(p.amount, p.currency),
            }))
          : null,
        balance,
        paymentInstructions: showInstructions ? org.paymentInstructions : null,
        notes: st.notes,
        formatMoney,
      }}
    />,
  );
  return { buffer, filename: `${st.number}.pdf` };
}
