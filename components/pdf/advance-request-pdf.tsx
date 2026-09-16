import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface AdvanceChargePdfItem {
  description: string;
  currency: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isTaxable: boolean;
}

export interface AdvanceRequestPdfData {
  operationCode: string;
  externalCode?: string | null;
  createdAt: Date;
  client: {
    name: string;
    documentType?: string | null;
    documentNumber?: string | null;
    address?: string | null;
  };
  blNumber?: string | null;
  incoterm?: string | null;
  items: AdvanceChargePdfItem[];
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
    borderBottomColor: "#0284c7",
    paddingBottom: 10,
    marginBottom: 12,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
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
    color: "#0284c7",
    textTransform: "uppercase",
  },
  docCode: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
    marginTop: 2,
  },

  noticeBox: {
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 3,
    padding: 6,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
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
    backgroundColor: "#0284c7",
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
    backgroundColor: "#e0f2fe",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#bae6fd",
  },
  thDesc: { width: "40%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1" },
  thCurr: { width: "12%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1", textAlign: "center" },
  thTaxable: { width: "13%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1", textAlign: "center" },
  thSubtotal: { width: "15%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1", textAlign: "right" },
  thTotal: { width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#0369a1", textAlign: "right" },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f9ff",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tdDesc: { width: "40%", fontSize: 8, color: "#0f172a", fontFamily: "Helvetica-Bold" },
  tdCurr: { width: "12%", fontSize: 8, textAlign: "center", color: "#475569" },
  tdTaxable: { width: "13%", fontSize: 8, textAlign: "center", color: "#475569" },
  tdSubtotal: { width: "15%", fontSize: 8, textAlign: "right", color: "#475569" },
  tdTotal: { width: "20%", fontSize: 8, textAlign: "right", fontFamily: "Helvetica-Bold", color: "#0369a1" },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  bankBox: {
    width: "55%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 3,
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  bankTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bankText: {
    fontSize: 7,
    color: "#334155",
    lineHeight: 1.4,
  },

  totalsBox: {
    width: "42%",
    borderWidth: 1,
    borderColor: "#bae6fd",
    borderRadius: 3,
    backgroundColor: "#f0f9ff",
    padding: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
  },
  totalVal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0c4a6e",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#bae6fd",
  },
  grandTotalLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0369a1",
  },
  grandTotalVal: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0c4a6e",
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

export function AdvanceRequestPDF({ data }: { data: AdvanceRequestPdfData }) {
  const formatDateStr = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("es-PE") : "-");

  // Calculations by currency
  const itemsUsd = data.items.filter((i) => i.currency === "USD");
  const itemsPen = data.items.filter((i) => i.currency === "PEN");

  const calcTotals = (items: AdvanceChargePdfItem[]) => {
    let subtotal = 0;
    let igv = 0;
    items.forEach((item) => {
      subtotal += item.totalPrice;
      if (item.isTaxable) {
        igv += item.totalPrice * 0.18;
      }
    });
    return {
      subtotal,
      igv,
      total: subtotal + igv,
    };
  };

  const totalsUsd = calcTotals(itemsUsd);
  const totalsPen = calcTotals(itemsPen);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>MARIVAN LOGISTICS SAC</Text>
            <Text style={styles.companySub}>Agenciamiento Aduanero & Logística Internacional</Text>
            <Text style={styles.companySub}>Calle Españoletto 115, Dpto. 101, San Borja • Tel: 969 3010 95</Text>
          </View>
          <View style={styles.docBox}>
            <Text style={styles.docTitle}>SOLICITUD DE ANTICIPO DE FONDOS</Text>
            <Text style={styles.docCode}>
              {data.externalCode || data.operationCode}
            </Text>
            <Text style={{ fontSize: 7, color: "#64748b", marginTop: 2 }}>
              Fecha Emisión: {formatDateStr(data.createdAt)}
            </Text>
          </View>
        </View>

        {/* Informative Notice Box */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            PROVISIÓN PREVIA DE FONDOS PARA GASTOS PRE-OPERATIVOS Y ADUANEROS. POR FAVOR DEPOSITAR EN LAS CUENTAS INDICADAS ANTES DE LA EJECUCIÓN DE TRÁMITES.
          </Text>
        </View>

        {/* Client details */}
        <View style={styles.clientBox}>
          <Text style={styles.clientTitle}>Datos del Cliente y Despacho</Text>
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
            <Text style={styles.clientLabel}>Referencia / BL:</Text>
            <Text style={styles.clientVal}>
              Ref: {data.externalCode || data.operationCode} • BL N° {data.blNumber || "-"} • Incoterm: {data.incoterm || "FOB"}
            </Text>
          </View>
        </View>

        {/* Table Title */}
        <Text style={styles.tableBlockTitle}>
          Detalle de Conceptos Requeridos como Anticipo
        </Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.thDesc}>Concepto / Gasto Pre-operativo</Text>
          <Text style={styles.thCurr}>Moneda</Text>
          <Text style={styles.thTaxable}>IGV (+18%)</Text>
          <Text style={styles.thSubtotal}>Base / Neto</Text>
          <Text style={styles.thTotal}>Total Concepto</Text>
        </View>

        {/* Table Rows */}
        {data.items.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tdDesc, width: "100%", textAlign: "center", color: "#94a3b8" }}>
              No hay conceptos seleccionados como anticipo.
            </Text>
          </View>
        ) : (
          data.items.map((item, idx) => {
            const igv = item.isTaxable ? item.totalPrice * 0.18 : 0;
            const totalWithIgv = item.totalPrice + igv;
            const sym = item.currency === "PEN" ? "S/ " : "$ ";

            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tdDesc}>{item.description}</Text>
                <Text style={styles.tdCurr}>{item.currency}</Text>
                <Text style={styles.tdTaxable}>{item.isTaxable ? "SI (18%)" : "NO"}</Text>
                <Text style={styles.tdSubtotal}>{sym}{item.totalPrice.toFixed(2)}</Text>
                <Text style={styles.tdTotal}>{sym}{totalWithIgv.toFixed(2)}</Text>
              </View>
            );
          })
        )}

        {/* Summary Container */}
        <View style={styles.summaryContainer}>
          {/* Bank Accounts Box */}
          <View style={styles.bankBox}>
            <Text style={styles.bankTitle}>Cuentas Bancarias Autorizadas</Text>
            <Text style={styles.bankText}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>BANCO DE CRÉDITO DEL PERÚ (BCP):</Text>
              {"\n"}• Cta. Soles (PEN): 191-98765432-0-12 | CCI: 002-191-0098765432012-54
              {"\n"}• Cta. Dólares (USD): 191-98765432-1-33 | CCI: 002-191-0098765432133-58
              {"\n\n"}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>BBVA BANCO CONTINENTAL:</Text>
              {"\n"}• Cta. Soles (PEN): 0011-0123-0100045678 | CCI: 011-123-000100045678-19
              {"\n"}• Cta. Dólares (USD): 0011-0123-0100045679 | CCI: 011-123-000100045679-22
              {"\n\n"}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Nota:</Text> Enviar constancia de pago indicando el código de referencia {data.externalCode || data.operationCode}.
            </Text>
          </View>

          {/* Totals Breakdown */}
          <View style={styles.totalsBox}>
            {totalsUsd.total > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal USD:</Text>
                  <Text style={styles.totalVal}>$ {totalsUsd.subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>IGV USD (18%):</Text>
                  <Text style={styles.totalVal}>$ {totalsUsd.igv.toFixed(2)}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL DEPOSITAR USD:</Text>
                  <Text style={styles.grandTotalVal}>$ {totalsUsd.total.toFixed(2)}</Text>
                </View>
              </>
            )}

            {totalsPen.total > 0 && (
              <View style={{ marginTop: totalsUsd.total > 0 ? 6 : 0, paddingTop: totalsUsd.total > 0 ? 6 : 0, borderTopWidth: totalsUsd.total > 0 ? 1 : 0, borderTopColor: "#bae6fd" }}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal PEN:</Text>
                  <Text style={styles.totalVal}>S/ {totalsPen.subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>IGV PEN (18%):</Text>
                  <Text style={styles.totalVal}>S/ {totalsPen.igv.toFixed(2)}</Text>
                </View>
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>TOTAL DEPOSITAR PEN:</Text>
                  <Text style={styles.grandTotalVal}>S/ {totalsPen.total.toFixed(2)}</Text>
                </View>
              </View>
            )}

            {totalsUsd.total === 0 && totalsPen.total === 0 && (
              <Text style={{ fontSize: 8, color: "#64748b", textAlign: "center" }}>
                $ 0.00
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FORWARDER ERP • Sistema de Gestión de Operaciones Logísticas • Documento de Solicitud de Fondos
          </Text>
        </View>
      </Page>
    </Document>
  );
}
