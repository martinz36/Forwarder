import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";

export interface QuotationPdfItem {
  description: string;
  category?: string;
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
  modality?: string | null;
  incoterm?: string | null;
  origin?: string | null;
  destination?: string | null;
  shippingType?: string | null;
  shippingLine?: string | null;
  frequency?: string | null;
  transitTime?: string | null;
  cargoType?: string | null;
  packagesCount?: string | null;
  grossWeight?: string | null;
  volume?: string | null;
  loadType?: string | null;
  containersCount?: string | null;
  notes?: string | null;
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
    padding: 30,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 10,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginBottom: 2,
  },
  companySub: {
    fontSize: 8,
    color: "#475569",
  },
  docBox: {
    alignItems: "flex-end",
  },
  docTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
  },
  docCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginTop: 2,
  },

  salutationBox: {
    marginBottom: 10,
  },
  salutationText: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.3,
  },
  clientNameBold: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  shipmentGrid: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
  },
  shipmentTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  gridCell: {
    width: "48%",
    flexDirection: "row",
  },
  gridLabel: {
    width: "45%",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  gridVal: {
    width: "55%",
    fontSize: 7.5,
    color: "#0f172a",
  },

  tableBlockTitle: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 6,
    textTransform: "uppercase",
    marginTop: 6,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  thDesc: { width: "42%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e293b" },
  thCurr: { width: "12%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e293b", textAlign: "center" },
  thPrice: { width: "16%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e293b", textAlign: "right" },
  thUsd: { width: "15%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e293b", textAlign: "right" },
  thPen: { width: "15%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e293b", textAlign: "right" },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tdDesc: { width: "42%", fontSize: 7.5, color: "#0f172a" },
  tdCurr: { width: "12%", fontSize: 7.5, textAlign: "center", color: "#475569" },
  tdPrice: { width: "16%", fontSize: 7.5, textAlign: "right", color: "#475569" },
  tdUsd: { width: "15%", fontSize: 7.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#0f172a" },
  tdPen: { width: "15%", fontSize: 7.5, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#0f172a" },

  totalCategoryRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
  },
  totalCategoryLabel: { width: "70%", fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e3a8a", textTransform: "uppercase" },
  totalCategoryUsd: { width: "15%", fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#1e3a8a" },
  totalCategoryPen: { width: "15%", fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#1e3a8a" },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  obsBox: {
    width: "55%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#fafafa",
  },
  obsTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  obsText: {
    fontSize: 7,
    color: "#475569",
    lineHeight: 1.3,
  },

  totalsBox: {
    width: "42%",
    borderWidth: 1,
    borderColor: "#1e3a8a",
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#1e293b",
    color: "#ffffff",
  },
  totalsTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#38bdf8",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 2,
    textAlign: "center",
  },
  rowSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  lblSummary: { fontSize: 7, color: "#cbd5e1" },
  valSummary: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#475569",
    paddingTop: 3,
    marginTop: 3,
  },
  grandTotalLbl: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  grandTotalVal: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#34d399" },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export function QuotationPDF({ data }: { data: QuotationPdfData }) {
  const originItems = data.items.filter(
    (i) => i.category === "GASTOS_ORIGEN" || i.category === "FLETE_INTERNACIONAL" || i.category === "SEGURO"
  );
  const localItems = data.items.filter((i) => i.category === "GASTOS_LOCALES" || !i.category);

  // Calculate section totals
  const originTotalUsd = originItems
    .filter((i) => i.currency === "USD")
    .reduce((sum, i) => sum + i.total, 0);
  const originTotalPen = originItems
    .filter((i) => i.currency === "PEN")
    .reduce((sum, i) => sum + i.total, 0);

  const localTotalUsd = localItems
    .filter((i) => i.currency === "USD")
    .reduce((sum, i) => sum + i.total, 0);
  const localTotalPen = localItems
    .filter((i) => i.currency === "PEN")
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>FORWARDER ERP - AGENCIA DE ADUANAS</Text>
            <Text style={styles.companySub}>Agenciamiento Aduanero y Logística Internacional</Text>
            <Text style={styles.companySub}>Callao, Perú • RUC: 20601335209</Text>
          </View>
          <View style={styles.docBox}>
            <Text style={styles.docTitle}>
              {data.modality ? `COTIZACIÓN DE ${data.modality}` : "COTIZACIÓN COMERCIAL"}
            </Text>
            <Text style={styles.docCode}>N° {data.code}</Text>
            <Text style={{ fontSize: 7, color: "#64748b", marginTop: 2 }}>
              Fecha: {formatDate(data.createdAt)}
            </Text>
          </View>
        </View>

        {/* Salutation & Client */}
        <View style={styles.salutationBox}>
          <Text style={styles.salutationText}>
            Señores: <Text style={styles.clientNameBold}>{data.client.name}</Text>
          </Text>
          {data.client.documentNumber && (
            <Text style={styles.salutationText}>
              {data.client.documentType || "RUC"}: {data.client.documentNumber}
            </Text>
          )}
          <Text style={[styles.salutationText, { marginTop: 4 }]}>
            Por medio de la presente tenemos el agrado de saludarlos y a la vez presentarles nuestra propuesta comercial para vuestro embarque según la información proporcionada:
          </Text>
        </View>

        {/* Shipment Info Grid */}
        <View style={styles.shipmentGrid}>
          <Text style={styles.shipmentTitle}>Datos del Embarque</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Origen:</Text>
              <Text style={styles.gridVal}>{data.origin || "NO ESPECIFICADO"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Tipo de Envío:</Text>
              <Text style={styles.gridVal}>{data.shippingType || "Directo"}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Destino:</Text>
              <Text style={styles.gridVal}>{data.destination || "CALLAO - PERU"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Línea Marítima:</Text>
              <Text style={styles.gridVal}>{data.shippingLine || "-"}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Producto / Carga:</Text>
              <Text style={styles.gridVal}>{data.cargoType || "CARGA GENERAL"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Tiempo Tránsito:</Text>
              <Text style={styles.gridVal}>{data.transitTime || "APROX."}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Peso / Volumen:</Text>
              <Text style={styles.gridVal}>
                {data.grossWeight || "-"} / {data.volume || "-"}
              </Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Tipo Flete/Cont:</Text>
              <Text style={styles.gridVal}>{data.loadType || "-"}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Incoterm:</Text>
              <Text style={styles.gridVal}>{data.incoterm || "EXW"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Vigencia:</Text>
              <Text style={styles.gridVal}>{formatDate(data.validUntil)}</Text>
            </View>
          </View>
        </View>

        {/* Table Block 1: GASTOS DE ORIGEN & FLETE */}
        {originItems.length > 0 && (
          <View>
            <Text style={styles.tableBlockTitle}>GASTOS DE ORIGEN, FLETE Y SEGURO</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.thDesc}>CONCEPTO</Text>
              <Text style={styles.thCurr}>MONEDA</Text>
              <Text style={styles.thPrice}>PRECIO UNIT.</Text>
              <Text style={styles.thUsd}>USD ($)</Text>
              <Text style={styles.thPen}>SOLES (S/)</Text>
            </View>
            {originItems.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tdDesc}>{item.description}</Text>
                <Text style={styles.tdCurr}>{item.currency}</Text>
                <Text style={styles.tdPrice}>{formatCurrency(item.unitPrice, item.currency as any)}</Text>
                <Text style={styles.tdUsd}>
                  {item.currency === "USD" ? formatCurrency(item.total, "USD") : "-"}
                </Text>
                <Text style={styles.tdPen}>
                  {item.currency === "PEN" ? formatCurrency(item.total, "PEN") : "-"}
                </Text>
              </View>
            ))}
            <View style={styles.totalCategoryRow}>
              <Text style={styles.totalCategoryLabel}>SUBTOTAL GASTOS ORIGEN / FLETE</Text>
              <Text style={styles.totalCategoryUsd}>{formatCurrency(originTotalUsd, "USD")}</Text>
              <Text style={styles.totalCategoryPen}>{formatCurrency(originTotalPen, "PEN")}</Text>
            </View>
          </View>
        )}

        {/* Table Block 2: GASTOS LOCALES */}
        {localItems.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.tableBlockTitle}>GASTOS LOCALES Y DESTINO</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.thDesc}>CONCEPTO</Text>
              <Text style={styles.thCurr}>MONEDA</Text>
              <Text style={styles.thPrice}>PRECIO UNIT.</Text>
              <Text style={styles.thUsd}>USD ($)</Text>
              <Text style={styles.thPen}>SOLES (S/)</Text>
            </View>
            {localItems.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tdDesc}>
                  {item.description} {item.isTaxable ? "(+ IGV 18%)" : ""}
                </Text>
                <Text style={styles.tdCurr}>{item.currency}</Text>
                <Text style={styles.tdPrice}>{formatCurrency(item.unitPrice, item.currency as any)}</Text>
                <Text style={styles.tdUsd}>
                  {item.currency === "USD" ? formatCurrency(item.total, "USD") : "-"}
                </Text>
                <Text style={styles.tdPen}>
                  {item.currency === "PEN" ? formatCurrency(item.total, "PEN") : "-"}
                </Text>
              </View>
            ))}
            <View style={styles.totalCategoryRow}>
              <Text style={styles.totalCategoryLabel}>SUBTOTAL GASTOS LOCALES</Text>
              <Text style={styles.totalCategoryUsd}>{formatCurrency(localTotalUsd, "USD")}</Text>
              <Text style={styles.totalCategoryPen}>{formatCurrency(localTotalPen, "PEN")}</Text>
            </View>
          </View>
        )}

        {/* Observations & Totals */}
        <View style={styles.summaryContainer}>
          <View style={styles.obsBox}>
            <Text style={styles.obsTitle}>Observaciones y Condiciones:</Text>
            <Text style={styles.obsText}>
              {data.notes ||
                "- Tarifa sujeta a variación según volumen/peso final verificado en origen.\n- Pago de flete a la confirmación de la reserva o emisión de BL."}
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <Text style={styles.totalsTitle}>RESUMEN GENERAL</Text>
            {data.grandTotalUsd > 0 && (
              <View style={{ marginBottom: 4 }}>
                <View style={styles.rowSummary}>
                  <Text style={styles.lblSummary}>Servicios Afectos IGV:</Text>
                  <Text style={styles.valSummary}>{formatCurrency(data.subtotalTaxableUsd, "USD")}</Text>
                </View>
                <View style={styles.rowSummary}>
                  <Text style={styles.lblSummary}>IGV (18%):</Text>
                  <Text style={styles.valSummary}>{formatCurrency(data.igvUsd, "USD")}</Text>
                </View>
                <View style={styles.rowSummary}>
                  <Text style={styles.lblSummary}>Inafectos / Origen:</Text>
                  <Text style={styles.valSummary}>{formatCurrency(data.totalNonTaxableUsd, "USD")}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLbl}>TOTAL USD:</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(data.grandTotalUsd, "USD")}</Text>
                </View>
              </View>
            )}

            {data.grandTotalPen > 0 && (
              <View>
                <View style={styles.rowSummary}>
                  <Text style={styles.lblSummary}>Servicios Afectos IGV:</Text>
                  <Text style={styles.valSummary}>{formatCurrency(data.subtotalTaxablePen, "PEN")}</Text>
                </View>
                <View style={styles.rowSummary}>
                  <Text style={styles.lblSummary}>IGV (18%):</Text>
                  <Text style={styles.valSummary}>{formatCurrency(data.igvPen, "PEN")}</Text>
                </View>
                <View style={styles.rowSummary}>
                  <Text style={styles.lblSummary}>Inafectos / Origen:</Text>
                  <Text style={styles.valSummary}>{formatCurrency(data.totalNonTaxablePen, "PEN")}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLbl}>TOTAL PEN:</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(data.grandTotalPen, "PEN")}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FORWARDER ERP — Documento generado para propuesta comercial de carga internacional
          </Text>
          <Text style={styles.footerText}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
