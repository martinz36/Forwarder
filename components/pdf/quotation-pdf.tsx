import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";

export interface QuotationPdfItem {
  description: string;
  currency: string;
  unitPrice: number;
  quantity: number;
  total: number;
  isTaxable: boolean;
}

export interface QuotationPdfData {
  code: string;
  createdAt: string | Date;
  validUntil?: string | Date | null;
  client: {
    name: string;
    documentType?: string | null;
    documentNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: QuotationPdfItem[];
  subtotalTaxableUsd: number;
  igvUsd: number;
  totalTaxableUsd: number;
  totalNonTaxableUsd: number;
  grandTotalUsd: number;

  subtotalTaxablePen: number;
  igvPen: number;
  totalTaxablePen: number;
  totalNonTaxablePen: number;
  grandTotalPen: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
    borderBottomStyle: "solid",
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  documentTitleBox: {
    alignItems: "flex-end",
  },
  docCode: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  docBadge: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaCol: {
    width: "48%",
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  clientName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  metaText: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 2,
  },
  table: {
    width: "100%",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thDesc: { width: "45%", color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8 },
  thCurr: { width: "12%", color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center" },
  thQty: { width: "10%", color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center" },
  thUnitPrice: { width: "16.5%", color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "right" },
  thTotal: { width: "16.5%", color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "right" },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tdDesc: { width: "45%", fontSize: 8.5, color: "#0f172a" },
  tdCurr: { width: "12%", fontSize: 8.5, textAlign: "center", fontFamily: "Helvetica-Bold", color: "#475569" },
  tdQty: { width: "10%", fontSize: 8.5, textAlign: "center", color: "#475569" },
  tdUnitPrice: { width: "16.5%", fontSize: 8.5, textAlign: "right", color: "#475569" },
  tdTotal: { width: "16.5%", fontSize: 8.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#0f172a" },

  taxBadge: {
    fontSize: 7,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
  },
  nonTaxBadge: {
    fontSize: 7,
    color: "#d97706",
    fontFamily: "Helvetica-Bold",
  },

  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  notesBox: {
    width: "48%",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 7.5,
    color: "#64748b",
    lineHeight: 1.3,
  },

  totalsBox: {
    width: "48%",
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 4,
    color: "#ffffff",
  },
  totalsTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#38bdf8",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingBottom: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 7.5,
    color: "#94a3b8",
  },
  totalVal: {
    fontSize: 7.5,
    color: "#f8fafc",
    fontFamily: "Helvetica-Bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 4,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  grandTotalVal: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#34d399",
  },

  footer: {
    position: "absolute",
    bottom: 25,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
});

export function QuotationPDF({ data }: { data: QuotationPdfData }) {
  const hasUsd = data.grandTotalUsd > 0;
  const hasPen = data.grandTotalPen > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>AGENCIA DE ADUANAS & LOGÍSTICA S.A.C.</Text>
            <Text style={styles.companyDetails}>RUC: 20601234567 • Callao, Perú</Text>
            <Text style={styles.companyDetails}>Tel: +51 1 555-0199 • cotizaciones@agencia.com.pe</Text>
          </View>
          <View style={styles.documentTitleBox}>
            <Text style={styles.docCode}>COTIZACIÓN DE SERVICIOS</Text>
            <Text style={styles.docBadge}>{data.code}</Text>
          </View>
        </View>

        {/* Client & Date Info */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.clientName}>{data.client.name}</Text>
            {data.client.documentNumber && (
              <Text style={styles.metaText}>
                {data.client.documentType || "RUC"}: {data.client.documentNumber}
              </Text>
            )}
            {data.client.address && <Text style={styles.metaText}>Dirección: {data.client.address}</Text>}
            {data.client.phone && <Text style={styles.metaText}>Teléfono: {data.client.phone}</Text>}
            {data.client.email && <Text style={styles.metaText}>Email: {data.client.email}</Text>}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DETALLES DE LA COTIZACIÓN</Text>
            <Text style={styles.metaText}>Fecha Emisión: {formatDate(data.createdAt)}</Text>
            <Text style={styles.metaText}>Validez Hasta: {formatDate(data.validUntil)}</Text>
            <Text style={styles.metaText}>Monedas: {hasUsd ? "USD ($) " : ""}{hasPen ? "PEN (S/)" : ""}</Text>
          </View>
        </View>

        {/* Table of Concepts */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>CONCEPTO / SERVICIO</Text>
            <Text style={styles.thCurr}>MONEDA</Text>
            <Text style={styles.thQty}>CANT.</Text>
            <Text style={styles.thUnitPrice}>PRECIO UNIT.</Text>
            <Text style={styles.thTotal}>TOTAL</Text>
          </View>

          {data.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.tdDesc}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{item.description}</Text>
                <Text style={item.isTaxable ? styles.taxBadge : styles.nonTaxBadge}>
                  {item.isTaxable ? "* Afecto a IGV (18%)" : "• Inafecto / Reembolso"}
                </Text>
              </View>
              <Text style={styles.tdCurr}>{item.currency}</Text>
              <Text style={styles.tdQty}>{item.quantity}</Text>
              <Text style={styles.tdUnitPrice}>
                {formatCurrency(item.unitPrice, item.currency as "USD" | "PEN")}
              </Text>
              <Text style={styles.tdTotal}>
                {formatCurrency(item.total, item.currency as "USD" | "PEN")}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary & Notes Section */}
        <View style={styles.summarySection}>
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>CONDICIONES COMERCIALES:</Text>
            <Text style={styles.notesText}>1. Precios sujetos a variación de fletes marítimos/aéreos.</Text>
            <Text style={styles.notesText}>2. Los conceptos inafectos corresponden a reembolsos por cuenta de terceros (Almacén, Tasas).</Text>
            <Text style={styles.notesText}>3. Forma de Pago: Transferencia bancaria a la emisión de la liquidación.</Text>
            <Text style={styles.notesText}>4. Validez de oferta: 15 días calendario desde la fecha de emisión.</Text>
          </View>

          <View style={styles.totalsBox}>
            <Text style={styles.totalsTitle}>RESUMEN DE COTIZACIÓN (CLIENTE)</Text>

            {hasUsd && (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 8, color: "#38bdf8", fontFamily: "Helvetica-Bold", marginBottom: 2 }}>DÓLARES (USD $)</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal Servicios Afectos:</Text>
                  <Text style={styles.totalVal}>{formatCurrency(data.subtotalTaxableUsd, "USD")}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>IGV (18% Ley Peruana):</Text>
                  <Text style={styles.totalVal}>{formatCurrency(data.igvUsd, "USD")}</Text>
                </View>
                {data.totalNonTaxableUsd > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal Reembolsos (Inafectos):</Text>
                    <Text style={styles.totalVal}>{formatCurrency(data.totalNonTaxableUsd, "USD")}</Text>
                  </View>
                )}
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL GENERAL USD:</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(data.grandTotalUsd, "USD")}</Text>
                </View>
              </View>
            )}

            {hasPen && (
              <View>
                <Text style={{ fontSize: 8, color: "#a855f7", fontFamily: "Helvetica-Bold", marginBottom: 2 }}>SOLES (PEN S/)</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal Servicios Afectos:</Text>
                  <Text style={styles.totalVal}>{formatCurrency(data.subtotalTaxablePen, "PEN")}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>IGV (18% Ley Peruana):</Text>
                  <Text style={styles.totalVal}>{formatCurrency(data.igvPen, "PEN")}</Text>
                </View>
                {data.totalNonTaxablePen > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal Reembolsos (Inafectos):</Text>
                    <Text style={styles.totalVal}>{formatCurrency(data.totalNonTaxablePen, "PEN")}</Text>
                  </View>
                )}
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL GENERAL PEN:</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(data.grandTotalPen, "PEN")}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AGENCIA DE ADUANAS & LOGÍSTICA S.A.C. — Documento generado para propuesta comercial</Text>
          <Text style={styles.footerText}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
