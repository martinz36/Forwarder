import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Sin cortes con guion ("por embar-que").
Font.registerHyphenationCallback((word) => [word]);
import type { Totals } from "@/lib/pricing/totals";

// Colores de DESIGN.md
const INK = "#15191F";
const INK2 = "#4B5361";
const INK3 = "#6B7280";
const RULE = "#E3DFD6";
const NAVY = "#0E2A45";
const SIGNAL = "#C2410C";
const PAPER = "#F5F3EE";

export const s = StyleSheet.create({
  // Sin lineHeight a nivel de página: rompe el pie fijo (react-pdf). Se aplica por estilo.
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9, color: INK },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: NAVY },
  muted: { color: INK3 },
  small: { fontSize: 7.5, color: INK3, marginTop: 1 },
  docTitle: { fontSize: 8, color: INK3, letterSpacing: 1.2, textAlign: "right" },
  docNumber: { fontSize: 15, fontFamily: "Courier-Bold", color: INK, textAlign: "right", marginTop: 3, marginBottom: 4, lineHeight: 1.1 },
  rule: { borderBottomWidth: 1, borderBottomColor: RULE, marginVertical: 12 },
  accent: { borderBottomWidth: 2, borderBottomColor: SIGNAL, width: 36, marginTop: 6 },
  label: { fontSize: 7, color: INK3, textTransform: "uppercase", letterSpacing: 0.6 },
  value: { fontSize: 9, marginTop: 1, lineHeight: 1.35 },
  grid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderLeftWidth: 1, borderColor: RULE },
  cell: { width: "25%", paddingVertical: 5, paddingHorizontal: 6, borderRightWidth: 1, borderBottomWidth: 1, borderColor: RULE },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: NAVY, textTransform: "uppercase", letterSpacing: 0.8, backgroundColor: PAPER, paddingVertical: 4, paddingHorizontal: 6, marginTop: 8 },
  th: { fontSize: 7, color: INK3, paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: RULE },
  td: { paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: RULE },
  colConcept: { flex: 1 },
  colQty: { width: 100, textAlign: "right" },
  colUnit: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  totalsBox: { width: 230, borderWidth: 1, borderColor: RULE, marginLeft: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: RULE },
  grand: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 8, backgroundColor: NAVY, color: "#FFFFFF" },
  footerBar: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: INK3 },
  termsHeading: { fontFamily: "Helvetica-Bold", color: NAVY, fontSize: 8.5, marginTop: 8, marginBottom: 2 },
  termsLine: { color: INK2, fontSize: 8.5, lineHeight: 1.4, marginBottom: 1.5 },
  watermark: { position: "absolute", top: 330, left: 90, fontSize: 80, color: "#C2410C", opacity: 0.08, transform: "rotate(-30deg)", fontFamily: "Helvetica-Bold" },
});

export interface QuotePdfLine {
  description: string;
  group: string;
  sectionLabel: string;
  taxLabel: string;
  isTaxed: boolean;
  quantity: string;
  basisLabel: string;
  unitPrice: string;
  total: string;
  isOptional: boolean;
}

export interface QuotePdfData {
  draft: boolean;
  company: { name: string; legalName: string; taxId: string | null; address: string | null; phone: string | null; email: string | null; website: string | null };
  number: string;
  versionNo: number;
  issuedAt: string;
  validUntil: string | null;
  expediente: string | null;
  client: { legalName: string; taxId: string | null; taxIdType: string; contact: string | null; email: string | null; phone: string | null };
  facts: { label: string; value: string }[];
  sections: { label: string; lines: QuotePdfLine[] }[];
  optional: QuotePdfLine[];
  totals: Totals;
  taxRate: string;
  notes: string | null;
  terms: string | null;
  formatMoney: (value: string, currency: string) => string;
}

export function LineRow({ l }: { l: QuotePdfLine }) {
  return (
    <View style={s.row} wrap={false}>
      <View style={[s.td, s.colConcept]}>
        <Text>{l.description}</Text>
        <Text style={[s.small, { color: l.isTaxed ? INK3 : "#9A5B00" }]}>{l.taxLabel}</Text>
      </View>
      <Text style={[s.td, s.colQty]}>{l.quantity}</Text>
      <Text style={[s.td, s.colUnit]}>{l.unitPrice}</Text>
      <Text style={[s.td, s.colTotal, { fontFamily: "Helvetica-Bold" }]}>{l.total}</Text>
    </View>
  );
}

export type PdfCompany = QuotePdfData["company"];

/** Encabezado común de todos los documentos: empresa a la izquierda, tipo y número a la derecha. */
export function DocHeader({ company, title, number, meta }: { company: PdfCompany; title: string; number: string; meta: string[] }) {
  return (
    <View fixed>
      <View style={s.between}>
        <View style={{ maxWidth: 300 }}>
          <Text style={s.brand}>{company.name}</Text>
          <View style={s.accent} />
          <Text style={[s.small, { marginTop: 6 }]}>
            {company.legalName}
            {company.taxId ? ` · RUC ${company.taxId}` : ""}
          </Text>
          {company.address && <Text style={s.small}>{company.address}</Text>}
          <Text style={s.small}>{[company.phone, company.email, company.website].filter(Boolean).join(" · ")}</Text>
        </View>
        <View>
          <Text style={s.docTitle}>{title}</Text>
          <Text style={s.docNumber}>{number}</Text>
          {meta.map((m) => (
            <Text key={m} style={[s.small, { textAlign: "right" }]}>
              {m}
            </Text>
          ))}
        </View>
      </View>
      <View style={s.rule} />
    </View>
  );
}

function Header({ d }: { d: QuotePdfData }) {
  return (
    <DocHeader
      company={d.company}
      title="COTIZACIÓN"
      number={d.number}
      meta={[
        `Versión ${d.versionNo} · ${d.issuedAt}`,
        ...(d.validUntil ? [`Válida hasta ${d.validUntil}`] : []),
        ...(d.expediente ? [`Ref. expediente ${d.expediente}`] : []),
      ]}
    />
  );
}

export function PdfFooter({ legalName, number }: { legalName: string; number: string }) {
  return (
    <View
      style={s.footerBar}
      fixed
      // totalPages existe en tiempo de ejecución aunque los tipos de View no lo declaren.
      render={(props) => {
        const { pageNumber, totalPages } = props as unknown as { pageNumber: number; totalPages: number };
        return (
          <>
            <Text>{`${legalName} · ${number}`}</Text>
            <Text>{`Página ${pageNumber} de ${totalPages}`}</Text>
          </>
        );
      }}
    />
  );
}

function Footer({ d }: { d: QuotePdfData }) {
  return <PdfFooter legalName={d.company.legalName} number={d.number} />;
}

/** Condiciones: las líneas en mayúsculas sin viñeta se muestran como títulos. */
function Terms({ text }: { text: string }) {
  return (
    <View>
      {text
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line, i) => {
          const heading = !line.trim().startsWith("•") && line === line.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(line);
          return (
            <Text key={i} style={heading ? s.termsHeading : s.termsLine}>
              {line.trim()}
            </Text>
          );
        })}
    </View>
  );
}

/** Totales por moneda (USD primero). */
export function TotalsBlock({ totals, taxRate, formatMoney }: { totals: Totals; taxRate: string; formatMoney: (value: string, currency: string) => string }) {
  const currencies = Object.keys(totals).sort((a, b) => (a === "USD" ? -1 : b === "USD" ? 1 : a.localeCompare(b)));
  return (
    <View style={[s.row, { justifyContent: "flex-end", marginTop: 14 }]} wrap={false}>
      {currencies.map((cur) => {
        const t = totals[cur as keyof Totals]!;
        return (
          <View key={cur} style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.muted}>Servicios afectos</Text>
              <Text>{formatMoney(t.taxed, cur)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.muted}>IGV {taxRate}%</Text>
              <Text>{formatMoney(t.tax, cur)}</Text>
            </View>
            {Number(t.unaffected) + Number(t.exempt) > 0 && (
              <View style={s.totalsRow}>
                <Text style={s.muted}>Inafecto / exonerado</Text>
                <Text>{formatMoney(String(Number(t.unaffected) + Number(t.exempt)), cur)}</Text>
              </View>
            )}
            <View style={s.totalsRow}>
              <Text style={s.muted}>Reembolsos (origen, flete y terceros)</Text>
              <Text>{formatMoney(t.reimbursable, cur)}</Text>
            </View>
            <View style={s.grand}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>TOTAL {cur === "PEN" ? "SOLES" : "DÓLARES"}</Text>
              <Text style={{ fontFamily: "Courier-Bold", fontSize: 11 }}>{formatMoney(t.total, cur)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function QuotePdf({ d }: { d: QuotePdfData }) {
  return (
    <Document title={`${d.number} · ${d.client.legalName}`} author={d.company.legalName}>
      <Page size="A4" style={s.page}>
        {d.draft && <Text style={s.watermark} fixed>BORRADOR</Text>}
        <Header d={d} />

        <View style={s.between}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Cliente</Text>
            <Text style={[s.value, { fontFamily: "Helvetica-Bold" }]}>{d.client.legalName}</Text>
            {d.client.taxId && (
              <Text style={s.small}>
                {d.client.taxIdType} {d.client.taxId}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            {d.client.contact && (
              <>
                <Text style={s.label}>Atención</Text>
                <Text style={s.value}>{d.client.contact}</Text>
              </>
            )}
            <Text style={s.small}>{[d.client.email, d.client.phone].filter(Boolean).join(" · ")}</Text>
          </View>
        </View>

        {d.facts.length > 0 && (
          <View style={[s.grid, { marginTop: 12 }]}>
            {d.facts.map((f) => (
              <View key={f.label} style={s.cell}>
                <Text style={s.label}>{f.label}</Text>
                <Text style={s.value}>{f.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 14 }}>
          <View style={s.row}>
            <Text style={[s.th, s.colConcept]}>CONCEPTO</Text>
            <Text style={[s.th, s.colQty]}>CANTIDAD</Text>
            <Text style={[s.th, s.colUnit]}>P. UNITARIO</Text>
            <Text style={[s.th, s.colTotal]}>TOTAL</Text>
          </View>
          {d.sections.map((sec) => (
            <View key={sec.label}>
              <Text style={s.sectionTitle}>{sec.label}</Text>
              {sec.lines.map((l, i) => (
                <LineRow key={i} l={l} />
              ))}
            </View>
          ))}
          {d.optional.length > 0 && (
            <View>
              <Text style={[s.sectionTitle, { color: INK3 }]}>Opcionales (no incluidos en el total)</Text>
              {d.optional.map((l, i) => (
                <LineRow key={i} l={l} />
              ))}
            </View>
          )}
        </View>

        <TotalsBlock totals={d.totals} taxRate={d.taxRate} formatMoney={d.formatMoney} />

        {d.notes && (
          <View style={{ marginTop: 16 }} wrap={false}>
            <Text style={s.label}>Observaciones</Text>
            <Text style={[s.value, { color: INK2 }]}>{d.notes}</Text>
          </View>
        )}

        <Footer d={d} />
      </Page>

      {d.terms && (
        <Page size="A4" style={s.page}>
          {d.draft && <Text style={s.watermark} fixed>BORRADOR</Text>}
          <Header d={d} />
          <Text style={[s.label, { marginBottom: 6 }]}>Condiciones generales</Text>
          <Terms text={d.terms} />
          <Footer d={d} />
        </Page>
      )}
    </Document>
  );
}
