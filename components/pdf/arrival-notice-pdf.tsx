import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";

export interface ArrivalNoticeChargeItem {
  description: string;
  category?: string;
  currency: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isTaxable: boolean;
  isExtraCharge?: boolean;
}

export interface ArrivalNoticePdfData {
  operationCode: string;
  blNumber?: string | null;
  etd?: Date | string | null;
  eta?: Date | string | null;
  origin?: string | null;
  destination?: string | null;
  shippingLine?: string | null;
  customsChannel?: string | null;
  createdAt: Date | string;
  client: {
    name: string;
    documentType?: string | null;
    documentNumber?: string | null;
    address?: string | null;
  };
  charges: ArrivalNoticeChargeItem[];
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
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
  },
  subCompany: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  documentTitleBox: {
    alignItems: "flex-end",
  },
  documentTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  documentSubTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#d97706",
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    marginBottom: 6,
    marginTop: 10,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#93c5fd",
  },
  table: {
    width: "100%",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  colDesc: { flex: 4 },
  colCurr: { flex: 1, textAlign: "center" },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },

  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  tdText: {
    fontSize: 8.5,
    color: "#334155",
  },
  totalsBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  currencyTotalCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    color: "#ffffff",
    borderRadius: 6,
    padding: 10,
  },
  cardTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  cardRowText: {
    fontSize: 8,
    color: "#cbd5e1",
  },
  cardRowBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 6,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#34d399",
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#34d399",
  },
  noticeFooter: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fef3c7",
    borderRadius: 6,
  },
  noticeText: {
    fontSize: 8,
    color: "#92400e",
    lineHeight: 1.3,
  },
});

export function ArrivalNoticePDF({ data }: { data: ArrivalNoticePdfData }) {
  const taxableCharges = data.charges.filter((c) => c.isTaxable);
  const nonTaxableCharges = data.charges.filter((c) => !c.isTaxable);

  return (
    <Document title={`Aviso_Llegada_${data.operationCode}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.companyName}>AGENCIA DE ADUANAS & LOGÍSTICA S.A.C.</Text>
            <Text style={styles.subCompany}>RUC: 20601234567 • Callao, Perú</Text>
            <Text style={styles.subCompany}>Operaciones de Comercio Exterior</Text>
          </View>
          <View style={styles.documentTitleBox}>
            <Text style={styles.documentTitle}>AVISO DE LLEGADA</Text>
            <Text style={styles.documentSubTitle}>SOLICITUD DE FONDOS</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 4 }}>
              Ref: {data.operationCode}
            </Text>
          </View>
        </View>

        {/* Client & Metadata Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Cliente Importador</Text>
            <Text style={styles.metaValue}>{data.client.name}</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
              {data.client.documentType}: {data.client.documentNumber}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Documento de Embarque</Text>
            <Text style={styles.metaValue}>BL: {data.blNumber || "Pendiente"}</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
              Llegada ETA: {formatDate(data.eta)}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Detalles de Carga</Text>
            <Text style={styles.metaValue}>{data.shippingLine || "N/A"}</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
              Canal: {data.customsChannel || "VERDE"}
            </Text>
          </View>
        </View>

        {/* Table 1: Servicios Afectos a IGV (18%) */}
        {taxableCharges.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>1. Servicios Facturables del Broker (Afectos a IGV 18%)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDesc, styles.thText]}>Concepto</Text>
                <Text style={[styles.colCurr, styles.thText]}>Moneda</Text>
                <Text style={[styles.colQty, styles.thText]}>Cant.</Text>
                <Text style={[styles.colPrice, styles.thText]}>Precio Unit.</Text>
                <Text style={[styles.colTotal, styles.thText]}>Total Venta</Text>
              </View>
              {taxableCharges.map((item, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <Text style={[styles.colDesc, styles.tdText]}>
                    {item.description} {item.isExtraCharge ? "(Sobrecosto)" : ""}
                  </Text>
                  <Text style={[styles.colCurr, styles.tdText]}>{item.currency}</Text>
                  <Text style={[styles.colQty, styles.tdText]}>{item.quantity}</Text>
                  <Text style={[styles.colPrice, styles.tdText]}>
                    {formatCurrency(item.unitPrice, item.currency as any)}
                  </Text>
                  <Text style={[styles.colTotal, styles.tdText, { fontFamily: "Helvetica-Bold" }]}>
                    {formatCurrency(item.totalPrice, item.currency as any)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Table 2: Reembolsos Inafectos */}
        {nonTaxableCharges.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>2. Pagos por Cuenta de Terceros (Reembolsos Inafectos)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDesc, styles.thText]}>Reembolso / Pago Terceros</Text>
                <Text style={[styles.colCurr, styles.thText]}>Moneda</Text>
                <Text style={[styles.colQty, styles.thText]}>Cant.</Text>
                <Text style={[styles.colPrice, styles.thText]}>Monto Unit.</Text>
                <Text style={[styles.colTotal, styles.thText]}>Total Reembolso</Text>
              </View>
              {nonTaxableCharges.map((item, idx) => (
                <View style={styles.tableRow} key={idx}>
                  <Text style={[styles.colDesc, styles.tdText]}>
                    {item.description} {item.isExtraCharge ? "(Sobrecosto)" : ""}
                  </Text>
                  <Text style={[styles.colCurr, styles.tdText]}>{item.currency}</Text>
                  <Text style={[styles.colQty, styles.tdText]}>{item.quantity}</Text>
                  <Text style={[styles.colPrice, styles.tdText]}>
                    {formatCurrency(item.unitPrice, item.currency as any)}
                  </Text>
                  <Text style={[styles.colTotal, styles.tdText, { fontFamily: "Helvetica-Bold" }]}>
                    {formatCurrency(item.totalPrice, item.currency as any)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Total Funds Requested */}
        <View style={styles.totalsBox}>
          {/* USD Summary */}
          <View style={styles.currencyTotalCard}>
            <Text style={styles.cardTitle}>Solicitud de Fondos (Dólares USD $)</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowText}>Servicios Facturables + IGV:</Text>
              <Text style={styles.cardRowBold}>{formatCurrency(data.totalTaxableUsd, "USD")}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowText}>Reembolsos Inafectos:</Text>
              <Text style={styles.cardRowBold}>{formatCurrency(data.totalNonTaxableUsd, "USD")}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL A DEPOSITAR USD:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(data.grandTotalUsd, "USD")}</Text>
            </View>
          </View>

          {/* PEN Summary */}
          <View style={styles.currencyTotalCard}>
            <Text style={styles.cardTitle}>Solicitud de Fondos (Soles PEN S/)</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowText}>Servicios Facturables + IGV:</Text>
              <Text style={styles.cardRowBold}>{formatCurrency(data.totalTaxablePen, "PEN")}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowText}>Reembolsos Inafectos:</Text>
              <Text style={styles.cardRowBold}>{formatCurrency(data.totalNonTaxablePen, "PEN")}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL A DEPOSITAR PEN:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(data.grandTotalPen, "PEN")}</Text>
            </View>
          </View>
        </View>

        {/* Bank Instructions Footer */}
        <View style={styles.noticeFooter}>
          <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#78350f", marginBottom: 2 }}>
            INSTRUCCIONES DE DEPÓSITO Y RETIRO DE CARGA:
          </Text>
          <Text style={styles.noticeText}>
            • Rogamos efectuar la transferencia / depósito de fondos antes de la fecha de llegada de la nave para evitar demoras y sobrecostos en almacenamiento o estadía.
          </Text>
          <Text style={styles.noticeText}>
            • Cuenta Cte. USD BCP: 193-98765432-1-88 (CCI: 002-193-0098765432188-12) • Cuenta Cte. PEN BCP: 193-12345678-0-99
          </Text>
        </View>
      </Page>
    </Document>
  );
}
