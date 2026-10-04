import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";
import { PdfHeader } from "./pdf-header";

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
  etd?: string | null;
  eta?: string | null;
  blNro?: string | null;
  shipper?: string | null;
  mercaderia?: string | null;
  formaPago?: string | null;
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
    paddingVertical: 3,
    paddingHorizontal: 6,
    textTransform: "uppercase",
    borderRadius: 2,
    marginBottom: 2,
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
    justifyContent: "flex-end",
    marginTop: 14,
  },

  totalsBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#1e3a8a",
    borderRadius: 4,
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

  annexTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a8a",
    paddingBottom: 4,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  annexSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  annexSubtitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  annexText: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.45,
    marginBottom: 4,
  },

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
      {/* PAGE 1: RESUMEN Y DETALLE DE COTIZACIÓN */}
      <Page size="A4" style={styles.page}>
        {/* Header with Unified Marivan Logo */}
        <PdfHeader
          docTitle={data.modality ? `COTIZACIÓN DE ${data.modality}` : "COTIZACIÓN COMERCIAL"}
          docCode={`N° ${data.code}`}
          docSubtitle={`FECHA: ${formatDate(data.createdAt)}`}
        />

        {/* Salutation & Client */}
        <View style={styles.salutationBox}>
          <Text style={styles.salutationText}>
            Estimados Sres. <Text style={styles.clientNameBold}>{data.client.name.toUpperCase()}</Text>
            {data.client.documentNumber ? ` (RUC/Doc: ${data.client.documentNumber})` : ""}
          </Text>
          <Text style={[styles.salutationText, { marginTop: 2 }]}>
            Presentamos nuestra propuesta comercial para el servicio de agenciamiento y transporte internacional según el detalle a continuación:
          </Text>
        </View>

        {/* Shipment Metadata Grid */}
        <View style={styles.shipmentGrid}>
          <Text style={styles.shipmentTitle}>INFORMACIÓN DEL EMBARQUE / PRE-ALERTA</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Modalidad:</Text>
              <Text style={styles.gridVal}>{data.modality || "Importación Marítima"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Incoterm:</Text>
              <Text style={styles.gridVal}>{data.incoterm || "FOB"}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Origen (POL):</Text>
              <Text style={styles.gridVal}>{data.origin || "-"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Destino (POD):</Text>
              <Text style={styles.gridVal}>{data.destination || "Callao, Perú"}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Nave / Línea:</Text>
              <Text style={styles.gridVal}>{data.shippingLine || "-"}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Tipo Carga:</Text>
              <Text style={styles.gridVal}>
                {data.loadType || "LCL"} {data.cargoType ? `(${data.cargoType})` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Peso / Vol.:</Text>
              <Text style={styles.gridVal}>
                {data.grossWeight ? `${data.grossWeight} KG` : "-"} / {data.volume ? `${data.volume} CBM` : "-"}
              </Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Bultos / Cant.:</Text>
              <Text style={styles.gridVal}>
                {data.packagesCount ? `${data.packagesCount} Bultos` : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Table Block 1: GASTOS DE ORIGEN */}
        {originItems.length > 0 && (
          <View>
            <Text style={styles.tableBlockTitle}>GASTOS DE ORIGEN</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.thDesc}>CONCEPTO</Text>
              <Text style={styles.thCurr}>MONEDA</Text>
              <Text style={styles.thPrice}>VALOR UNIT.</Text>
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
              <Text style={styles.totalCategoryLabel}>SUBTOTAL GASTOS ORIGEN</Text>
              <Text style={styles.totalCategoryUsd}>{formatCurrency(originTotalUsd, "USD")}</Text>
              <Text style={styles.totalCategoryPen}>{formatCurrency(originTotalPen, "PEN")}</Text>
            </View>
          </View>
        )}

        {/* Table Block 2: GASTOS DE DESTINO */}
        {localItems.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.tableBlockTitle}>GASTOS DE DESTINO</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.thDesc}>CONCEPTO</Text>
              <Text style={styles.thCurr}>MONEDA</Text>
              <Text style={styles.thPrice}>VALOR UNIT.</Text>
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
              <Text style={styles.totalCategoryLabel}>SUBTOTAL GASTOS DE DESTINO</Text>
              <Text style={styles.totalCategoryUsd}>{formatCurrency(localTotalUsd, "USD")}</Text>
              <Text style={styles.totalCategoryPen}>{formatCurrency(localTotalPen, "PEN")}</Text>
            </View>
          </View>
        )}

        {/* Totals Box Summary (Page 1) */}
        <View style={styles.summaryContainer}>
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

        {/* Footer Page 1 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MARIVAN LOGISTICS SAC — Propuesta comercial oficial de carga internacional
          </Text>
          <Text style={styles.footerText}>Página 1 de 2</Text>
        </View>
      </Page>

      {/* PAGE 2: ANEXO DE CONDICIONES GENERALES Y TÉRMINOS DEL SERVICIO */}
      <Page size="A4" style={styles.page}>
        <PdfHeader
          docTitle="ANEXO: CONDICIONES GENERALES"
          docCode={`N° ${data.code}`}
          docSubtitle="TÉRMINOS Y CONDICIONES DEL SERVICIO"
        />

        <View style={{ marginTop: 6, marginBottom: 12 }}>
          <Text style={styles.annexTitle}>ANEXO DE CONDICIONES GENERALES Y TÉRMINOS DEL SERVICIO</Text>

          <View style={styles.annexSection}>
            <Text style={styles.annexSubtitle}>1. VALIDEZ DE OFERTA Y VARIACIÓN DE TARIFAS</Text>
            <Text style={styles.annexText}>
              • La presente propuesta comercial tiene una validez de 15 días calendario a partir de su fecha de emisión, o hasta la fecha límite indicada en la cabecera del documento.
            </Text>
            <Text style={styles.annexText}>
              • Las tarifas operativas y fletes internacionales están sujetos a variación según peso y volumen final verificado por el depósito temporal o almacén de origen.
            </Text>
          </View>

          <View style={styles.annexSection}>
            <Text style={styles.annexSubtitle}>2. FACTURACIÓN Y MODALIDAD DE PAGO</Text>
            <Text style={styles.annexText}>
              • Los servicios locales y corretaje aduanero afectos al 18% IGV serán facturados oficialmente según normas contables de SUNAT a la emisión de la Pre-Alerta o liquidación.
            </Text>
            <Text style={styles.annexText}>
              • Los conceptos inafectos (derechos DUA/DAM, flete internacional, almacenajes de línea, aforos) se gestionan bajo modalidad de reembolso de gastos contra comprobantes oficiales.
            </Text>
            <Text style={styles.annexText}>
              • El cliente deberá cancelar los derechos aduaneros e impuestos previos al retiro y levante autorizado de la mercancía.
            </Text>
          </View>

          <View style={styles.annexSection}>
            <Text style={styles.annexSubtitle}>3. RESPONSABILIDAD DOCUMENTARIA Y OBSERVACIONES</Text>
            <Text style={styles.annexText}>
              • El cliente es responsable de entregar la documentación de embarque (Factura Comercial, Packing List, BL/Guía Aérea, Fichas Técnicas/Permisos VUCE) completa y correcta dentro de los plazos requeridos.
            </Text>
            <Text style={styles.annexText}>
              • MARIVAN LOGISTICS SAC no asume responsabilidad por sobrestadías, almacenajes adicionales o sobrecostos derivados de inspecciones (canal rojo/naranja) no imputables a nuestra gestión.
            </Text>
            <Text style={styles.annexText}>
              • Observaciones específicas del cliente/operación: {data.notes ? data.notes : "Ninguna observación adicional registrada."}
            </Text>
          </View>
        </View>

        {/* Footer Page 2 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MARIVAN LOGISTICS SAC — Documento anexo de términos y condiciones del servicio
          </Text>
          <Text style={styles.footerText}>Página 2 de 2</Text>
        </View>
      </Page>
    </Document>
  );
}
