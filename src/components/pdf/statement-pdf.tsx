import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { Totals } from "@/lib/pricing/totals";
import type { BalanceRow } from "@/server/billing";
import { DocHeader, LineRow, PdfFooter, s, TotalsBlock, type PdfCompany, type QuotePdfLine } from "./quote-pdf";

const INK2 = "#4B5361";
const RULE = "#E3DFD6";
const PAPER = "#F5F3EE";
const NAVY = "#0E2A45";

export interface StatementPdfData {
  title: string;
  intro: string | null;
  void: boolean;
  company: PdfCompany;
  number: string;
  meta: string[];
  client: { legalName: string; taxId: string | null; taxIdType: string; contact: string | null; email: string | null; phone: string | null };
  facts: { label: string; value: string }[];
  sections: { label: string; lines: QuotePdfLine[] }[];
  totals: Totals;
  taxRate: string;
  payments: { date: string; detail: string; amount: string }[] | null;
  balance: BalanceRow[] | null;
  paymentInstructions: string | null;
  notes: string | null;
  formatMoney: (value: string, currency: string) => string;
}

export function StatementPdf({ d }: { d: StatementPdfData }) {
  return (
    <Document title={`${d.number} · ${d.client.legalName}`} author={d.company.legalName}>
      <Page size="A4" style={s.page}>
        {d.void && (
          <Text style={s.watermark} fixed>
            ANULADO
          </Text>
        )}
        <DocHeader company={d.company} title={d.title} number={d.number} meta={d.meta} />

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

        {d.intro && <Text style={{ marginTop: 10, color: INK2 }}>{d.intro}</Text>}

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
        </View>

        <TotalsBlock totals={d.totals} taxRate={d.taxRate} formatMoney={d.formatMoney} />

        {d.payments && (
          <View style={{ marginTop: 16 }} wrap={false}>
            <Text style={s.label}>Depósitos recibidos</Text>
            {d.payments.length === 0 ? (
              <Text style={[s.value, { color: INK2 }]}>Sin depósitos registrados.</Text>
            ) : (
              d.payments.map((p, i) => (
                <View key={i} style={[s.row, { borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 3 }]}>
                  <Text style={{ width: 80 }}>{p.date}</Text>
                  <Text style={{ flex: 1, color: INK2 }}>{p.detail}</Text>
                  <Text style={{ width: 100, textAlign: "right" }}>{p.amount}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {d.balance && (
          <View style={[s.row, { justifyContent: "flex-end", marginTop: 12 }]} wrap={false}>
            {d.balance.map((b) => {
              const amount = Number(b.balance);
              return (
                <View key={b.currency} style={[s.totalsBox, { borderColor: NAVY }]}>
                  <View style={s.totalsRow}>
                    <Text style={s.muted}>Total liquidado</Text>
                    <Text>{d.formatMoney(b.charged, b.currency)}</Text>
                  </View>
                  <View style={s.totalsRow}>
                    <Text style={s.muted}>Depósitos</Text>
                    <Text>− {d.formatMoney(b.paid, b.currency)}</Text>
                  </View>
                  <View style={s.grand}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{amount > 0 ? "SALDO A PAGAR" : amount < 0 ? "SALDO A FAVOR" : "SIN SALDO"}</Text>
                    <Text style={{ fontFamily: "Courier-Bold", fontSize: 11 }}>{d.formatMoney(Math.abs(amount).toFixed(2), b.currency)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {d.paymentInstructions && (
          <View style={{ marginTop: 16, padding: 10, backgroundColor: PAPER }} wrap={false}>
            <Text style={s.label}>Cuentas para depósito</Text>
            <Text style={[s.value, { color: INK2, lineHeight: 1.45 }]}>{d.paymentInstructions}</Text>
          </View>
        )}

        {d.notes && (
          <View style={{ marginTop: 14 }} wrap={false}>
            <Text style={s.label}>Observaciones</Text>
            <Text style={[s.value, { color: INK2 }]}>{d.notes}</Text>
          </View>
        )}

        <PdfFooter legalName={d.company.legalName} number={d.number} />
      </Page>
    </Document>
  );
}
