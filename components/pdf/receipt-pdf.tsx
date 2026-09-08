import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ReceiptPdfItem {
  description: string;
  currency: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ReceiptPdfData {
  receiptNumber: string;
  createdAt: Date;
  operationCode: string;
  blNumber?: string | null;
  client: {
    name: string;
    documentType?: string | null;
    documentNumber?: string | null;
    address?: string | null;
  };
  items: ReceiptPdfItem[];
  totalNonTaxableUsd: number;
  totalNonTaxablePen: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#d97706",
    paddingBottom: 10,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
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
    color: "#92400e",
    textTransform: "uppercase",
  },
  docCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
    marginTop: 2,
  },

  internalNoticeBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 3,
    padding: 6,
    marginBottom: 12,
  },
  internalNoticeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
    textAlign: "center",
  },

  clientBox: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
  },
  clientTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  clientLabel: {
    width: "25%",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
  },
  clientVal: {
    width: "75%",
    fontSize: 8,
    color: "#0f172a",
  },

  tableBlockTitle: {
    backgroundColor: "#b45309",
    color: "#ffffff",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 6,
    textTransform: "uppercase",
    marginBottom: 0,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  thDesc: { width: "50%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#78350f" },
  thCurr: { width: "15%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#78350f", textAlign: "center" },
  thPrice: { width: "15%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#78350f", textAlign: "right" },
  thTotal: { width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#78350f", textAlign: "right" },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#fef3c7",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tdDesc: { width: "50%", fontSize: 8, color: "#0f172a", fontFamily: "Helvetica-Bold" },
  tdCurr: { width: "15%", fontSize: 8, textAlign: "center", color: "#475569" },
  tdPrice: { width: "15%", fontSize: 8, textAlign: "right", color: "#475569" },
  tdTotal: { width: "20%", fontSize: 8, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#78350f" },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
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
    color: "#475569",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  obsText: {
    fontSize: 7,
    color: "#64748b",
    lineHeight: 1.3,
  },

  totalsBox: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 3,
    backgroundColor: "#fffbeb",
    padding: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#78350f",
  },
  totalVal: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
  },

  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    textAlign: "center",
  },
  footerText: {
    fontSize: 6.5,
    color: "#94a3b8",
  },
});

export function ReceiptPDF({ data }: { data: ReceiptPdfData }) {
  const formatDateStr = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("es-PE") : "-");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>AGENCIA DE ADUANAS & LOGÍSTICA S.A.C.</Text>
            <Text style={styles.companySub}>Agenciamiento Aduanero y Logística Internacional</Text>
            <Text style={styles.companySub}>Callao, Perú • RUC: 20601234567</Text>
          </View>
          <View style={styles.docBox}>
            <Text style={styles.docTitle}>RECIBO DE REEMBOLSO DE GASTOS</Text>
            <Text style={styles.docCode}>N° {data.receiptNumber}</Text>
            <Text style={{ fontSize: 7, color: "#64748b", marginTop: 2 }}>
              Fecha Emisión: {formatDateStr(data.createdAt)}
            </Text>
          </View>
        </View>

        {/* Legal Disclaimer Box */}
        <View style={styles.internalNoticeBox}>
          <Text style={styles.internalNoticeText}>
            DOCUMENTO DE CONTROL INTERNO - REEMBOLSO EXACTO DE PAGOS POR CUENTA DE TERCEROS (ART. 2 LEY DEL IGV). NO CONSTITUYE FACTURA NI CRÉDITO FISCAL.
          </Text>
        </View>

        {/* Client details */}
        <View style={styles.clientBox}>
          <Text style={styles.clientTitle}>Datos del Cliente y Operación</Text>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Cliente / Empresa:</Text>
            <Text style={styles.clientVal}>{data.client.name}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>RUC / Documento:</Text>
            <Text style={styles.clientVal}>
              {data.client.documentType || "RUC"}: {data.client.documentNumber || "-"}
            </Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Expediente / BL:</Text>
            <Text style={styles.clientVal}>
              Cotización {data.operationCode} • BL N° {data.blNumber || "-"}
            </Text>
          </View>
        </View>

        {/* Table Title */}
        <Text style={styles.tableBlockTitle}>
          Detalle de Reembolsos por Cuenta del Cliente (Inafectos a IGV)
        </Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.thDesc}>Reembolso / Concepto Terceros</Text>
          <Text style={styles.thCurr}>Moneda</Text>
          <Text style={styles.thPrice}>Precio Unit.</Text>
          <Text style={styles.thTotal}>Total Reembolso</Text>
        </View>

        {/* Table Rows */}
        {data.items.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.tdDesc}>{item.description}</Text>
            <Text style={styles.tdCurr}>{item.currency}</Text>
            <Text style={styles.tdPrice}>
              {item.currency === "PEN" ? "S/ " : "$ "}
              {item.unitPrice.toFixed(2)}
            </Text>
            <Text style={styles.tdTotal}>
              {item.currency === "PEN" ? "S/ " : "$ "}
              {item.totalPrice.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Totals Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.obsBox}>
            <Text style={styles.obsTitle}>Notas de Rendición</Text>
            <Text style={styles.obsText}>
              - Este recibo sustenta los pagos efectuados a terceros (Líneas Navieras, Depósitos Temporales, Gastos de Origen) pagados por cuenta y orden del cliente.
              {"\n"}- Los comprobantes originales de los proveedores de origen y servicios locales inafectos se adjuntan a la carpeta de liquidación.
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL REEMBOLSO (USD):</Text>
              <Text style={styles.totalVal}>$ {data.totalNonTaxableUsd.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL REEMBOLSO (PEN):</Text>
              <Text style={styles.totalVal}>S/ {data.totalNonTaxablePen.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FORWARDER ERP • Sistema Interno de Gestión Aduanera y Logística • Documento no sujeto a IGV
          </Text>
        </View>
      </Page>
    </Document>
  );
}
