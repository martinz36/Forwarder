"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Ship,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  FileText,
  DollarSign,
  AlertTriangle,
  Building2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Copy,
  Check,
  Eye,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/format";
import { QuotationDetailDialog } from "@/components/quotation-detail-dialog";
import { QuotationPdfData } from "@/components/pdf/quotation-pdf";

export interface MasterPortalOperation {
  id: string;
  quotationCode: string;
  quotationTotalUsd: number;
  quotationTotalPen: number;
  quotationPdfData: QuotationPdfData;
  blNumber?: string | null;
  status: string;
  incoterm?: string | null;
  modality?: string | null;
  origin?: string | null;
  destination?: string | null;
  cargoType?: string | null;
  etd?: Date | string | null;
  eta?: Date | string | null;
  customsChannel?: string | null;
  sharedToken: string;
  hblApproved: boolean;
  customsDocsSent: boolean;
  taxesPaid: boolean;
  transportDocsSent: boolean;
  cargoDelivered: boolean;
  createdAt: Date | string;
  documentsCount: number;
  totalChargesUsd: number;
  totalChargesPen: number;
  totalPaidUsd: number;
  totalPaidPen: number;
  liquidationStatus?: string | null;
  liquidationGrandTotalUsd?: number | null;
  liquidationGrandTotalPen?: number | null;
}

export interface MasterPortalQuotation {
  id: string;
  code: string;
  status: string;
  createdAt: Date | string;
  totalUsd: number;
  totalPen: number;
  pdfData: QuotationPdfData;
  operationId?: string;
  operationStatus?: string;
  sharedToken?: string;
}

interface MasterClientPortalProps {
  clientName: string;
  documentType?: string | null;
  documentNumber?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  operations: MasterPortalOperation[];
  quotations: MasterPortalQuotation[];
  companyName?: string;
}

const statusLabelMap: Record<string, string> = {
  COORDINANDO_ORIGEN: "Coordinación en Origen",
  POR_RECOGER: "Pendiente de Recojo",
  EN_ALMACEN_ORIGEN: "En Almacén de Origen",
  EN_TRANSITO: "En Tránsito Internacional",
  EN_ADUANA_DESTINO: "En Despacho Aduanero",
  EN_REPARTO: "En Reparto Local",
  ENTREGADO: "Mercancía Entregada",
  LIQUIDADO: "Despacho Liquidado",
};

const statusBadgeColorMap: Record<string, string> = {
  COORDINANDO_ORIGEN: "bg-blue-50 text-blue-700 border-blue-200",
  POR_RECOGER: "bg-amber-50 text-amber-700 border-amber-200",
  EN_ALMACEN_ORIGEN: "bg-indigo-50 text-indigo-700 border-indigo-200",
  EN_TRANSITO: "bg-cyan-50 text-cyan-700 border-cyan-200",
  EN_ADUANA_DESTINO: "bg-purple-50 text-purple-700 border-purple-200",
  EN_REPARTO: "bg-orange-50 text-orange-700 border-orange-200",
  ENTREGADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LIQUIDADO: "bg-slate-100 text-slate-700 border-slate-300",
};

export function MasterClientPortal({
  clientName,
  documentType,
  documentNumber,
  contactName,
  email,
  phone,
  operations,
  quotations,
  companyName = "Marivan Logistics",
}: MasterClientPortalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter Active vs Completed Operations
  const activeOps = operations.filter((op) => op.status !== "LIQUIDADO");
  const completedOps = operations.filter((op) => op.status === "LIQUIDADO");

  // Filter by search query
  const filteredActiveOps = activeOps.filter((op) => {
    const q = searchQuery.toLowerCase();
    return (
      op.quotationCode.toLowerCase().includes(q) ||
      (op.blNumber && op.blNumber.toLowerCase().includes(q)) ||
      (op.origin && op.origin.toLowerCase().includes(q)) ||
      (op.destination && op.destination.toLowerCase().includes(q))
    );
  });

  const filteredCompletedOps = completedOps.filter((op) => {
    const q = searchQuery.toLowerCase();
    return (
      op.quotationCode.toLowerCase().includes(q) ||
      (op.blNumber && op.blNumber.toLowerCase().includes(q)) ||
      (op.origin && op.origin.toLowerCase().includes(q)) ||
      (op.destination && op.destination.toLowerCase().includes(q))
    );
  });

  const filteredQuotations = quotations.filter((qItem) => {
    const q = searchQuery.toLowerCase();
    return qItem.code.toLowerCase().includes(q);
  });

  // Calculate global balance
  let totalPendingUsd = 0;
  let totalPendingPen = 0;

  operations.forEach((op) => {
    const pendingUsd = Math.max(0, op.totalChargesUsd - op.totalPaidUsd);
    const pendingPen = Math.max(0, op.totalChargesPen - op.totalPaidPen);
    totalPendingUsd += pendingUsd;
    totalPendingPen += pendingPen;
  });

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 antialiased">
      {/* Brand Header */}
      <header className="border-b bg-slate-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
              <Anchor className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide">{companyName}</h1>
              <p className="text-xs text-slate-400">Portal Maestro de Carga & Seguimiento Logístico</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="text-right sm:text-right">
              <p className="text-xs font-bold text-slate-200">{clientName}</p>
              {documentNumber && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {documentType || "RUC"}: {documentNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* Welcome & KPI Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 mb-2 font-semibold">
                Portal Consolidado de Importaciones
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bienvenido, {clientName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Monitorea en tiempo real todas tus operaciones de comercio exterior, consulta tus cotizaciones aprobadas y descarga la documentación oficial.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="w-full md:w-72 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por BL, Cotización o Puerto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-400 text-xs h-9 font-medium"
              />
            </div>
          </div>

          {/* KPI Bento Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 space-y-1 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Operaciones Activas
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-blue-400">{activeOps.length}</span>
                <Ship className="h-5 w-5 text-blue-400" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 space-y-1 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Cotizaciones Registradas
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-indigo-400">{quotations.length}</span>
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4 space-y-1 backdrop-blur-sm col-span-1 sm:col-span-2 lg:col-span-2">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Saldo Pendiente de Cobro / Anticipo
              </span>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 font-mono font-bold text-base text-white">
                  <span>{formatCurrency(totalPendingUsd, "USD")}</span>
                  <span className="text-slate-500">•</span>
                  <span>{formatCurrency(totalPendingPen, "PEN")}</span>
                </div>
                {totalPendingUsd > 0 || totalPendingPen > 0 ? (
                  <Badge variant="outline" className="border-amber-400/50 text-amber-300 bg-amber-400/10 text-[10px]">
                    Pendiente de Pago
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-400/50 text-emerald-300 bg-emerald-400/10 text-[10px]">
                    Al Día
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Operaciones en Curso (Tránsito / Aduanas) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Ship className="h-5 w-5 text-blue-600" /> Operaciones en Curso (Tránsito / Aduanas)
            </h3>
            <Badge variant="secondary" className="font-semibold text-xs">
              {filteredActiveOps.length} Embarques
            </Badge>
          </div>

          {filteredActiveOps.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center space-y-3 shadow-xs">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Ship className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No hay operaciones activas en este momento.</p>
              <p className="text-xs text-slate-400">Todas tus cargas registradas se encuentran liquidadas o no coinciden con la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActiveOps.map((op) => (
                <div
                  key={op.id}
                  className="rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 border-slate-200"
                >
                  <div className="space-y-3">
                    {/* Top Badges Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {op.quotationCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(op.quotationCode)}
                          className="text-slate-400 hover:text-blue-600"
                          title="Copiar código"
                        >
                          {copiedCode === op.quotationCode ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {op.customsChannel && (
                          <Badge
                            className={
                              op.customsChannel === "VERDE"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : op.customsChannel === "NARANJA"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-red-100 text-red-800 border-red-300"
                            }
                          >
                            Canal {op.customsChannel}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${statusBadgeColorMap[op.status] || "bg-slate-50 text-slate-700"}`}
                        >
                          {statusLabelMap[op.status] || op.status}
                        </Badge>
                      </div>
                    </div>

                    {/* BL & Route Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-medium block">N° de BL / HBL:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {op.blNumber || "Pendiente de Emisión"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Modalidad / Carga:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {op.modality || "Importación"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Origen (POL):</span>
                        <span className="font-medium text-slate-800 truncate block">
                          {op.origin || "-"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Destino (POD):</span>
                        <span className="font-medium text-slate-800 truncate block">
                          {op.destination || "Callao, Perú"}
                        </span>
                      </div>
                    </div>

                    {/* Quotation Total & PDF Inspection */}
                    <div className="flex items-center justify-between bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs">
                      <div>
                        <span className="text-blue-900 font-bold block text-[11px] uppercase tracking-wider">Monto Cotizado Aprobado:</span>
                        <span className="font-mono font-black text-blue-950 text-sm">
                          {formatCurrency(op.quotationTotalUsd, "USD")}
                          {op.quotationTotalPen > 0 && ` • ${formatCurrency(op.quotationTotalPen, "PEN")}`}
                        </span>
                      </div>

                      <QuotationDetailDialog
                        pdfData={op.quotationPdfData}
                        totalUsd={op.quotationTotalUsd}
                        totalPen={op.quotationTotalPen}
                        buttonText="Ver / PDF"
                        buttonVariant="outline"
                        className="border-blue-300 text-blue-800 bg-white hover:bg-blue-100"
                      />
                    </div>

                    {/* Dates ETD / ETA */}
                    <div className="flex items-center justify-between text-xs px-1 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>ETD: <strong className="text-slate-800">{formatDate(op.etd)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span>ETA Est.: <strong className="text-blue-900">{formatDate(op.eta)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link to Individual Tracking Portal */}
                  <div className="pt-2 border-t flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      {op.documentsCount} documentos adjuntos
                    </span>

                    <Link href={`/shared/${op.sharedToken}`} target="_blank">
                      <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 px-4 shadow-sm flex items-center gap-1.5">
                        <span>Ver Detalle & Documentos</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: Cotizaciones Aprobadas & Propuestas Comerciales */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" /> Cotizaciones Aprobadas & Propuestas Comerciales
            </h3>
            <Badge variant="outline" className="font-semibold text-xs">
              {filteredQuotations.length} Registradas
            </Badge>
          </div>

          {filteredQuotations.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-center text-xs text-slate-400 shadow-xs">
              No hay cotizaciones registradas para este cliente.
            </div>
          ) : (
            <div className="rounded-2xl border bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5">Código Cotización</th>
                      <th className="p-3.5">Fecha Emisión</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Venta USD ($)</th>
                      <th className="p-3.5 text-right">Venta PEN (S/)</th>
                      <th className="p-3.5 text-center">Documento PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {q.code}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {formatDate(q.createdAt)}
                        </td>
                        <td className="p-3.5">
                          <Badge variant="secondary" className="font-semibold text-xs">
                            {q.status === "ACCEPTED" ? "Aceptada / Operación" : q.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(q.totalUsd, "USD")}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-700">
                          {formatCurrency(q.totalPen, "PEN")}
                        </td>
                        <td className="p-3.5 text-center">
                          <QuotationDetailDialog
                            pdfData={q.pdfData}
                            totalUsd={q.totalUsd}
                            totalPen={q.totalPen}
                            buttonText="Ver / Descargar PDF"
                            buttonVariant="outline"
                            className="border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: Historial y Despachos Liquidados */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-600" /> Historial y Despachos Liquidados
            </h3>
            <Badge variant="outline" className="font-semibold text-xs">
              {filteredCompletedOps.length} Finalizadas
            </Badge>
          </div>

          {filteredCompletedOps.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-center text-xs text-slate-400 shadow-xs">
              No hay despachos finalizados en el historial.
            </div>
          ) : (
            <div className="rounded-2xl border bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5">Referencia</th>
                      <th className="p-3.5">BL / Documento</th>
                      <th className="p-3.5">Origen / Destino</th>
                      <th className="p-3.5">Fecha Cierre</th>
                      <th className="p-3.5 text-right">Monto Total USD</th>
                      <th className="p-3.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredCompletedOps.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {op.quotationCode}
                        </td>
                        <td className="p-3.5 font-mono text-slate-800">
                          {op.blNumber || "-"}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {op.origin || "POL"} → {op.destination || "Callao"}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {formatDate(op.createdAt)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(op.totalChargesUsd, "USD")}
                        </td>
                        <td className="p-3.5 text-center">
                          <Link href={`/shared/${op.sharedToken}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-xs">
                              <FileText className="mr-1 h-3.5 w-3.5" /> Consultar BL / Factura
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: Estado de Cuenta & Saldos */}
        {(totalPendingUsd > 0 || totalPendingPen > 0) && (
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-amber-950 text-base">Estado de Cuenta & Pendientes de Pago</h3>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Tienes montos por concepto de cobro anticipado o liquidación final pendientes de regularización. Puedes consultar el detalle de cuentas bancarias solicitando tu estado de cuenta a operaciones.
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-xl p-4 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Saldo Deudor Consolidado:</span>
                <span className="text-slate-500">Pendiente a la fecha de hoy</span>
              </div>

              <div className="text-right font-mono font-black text-lg text-amber-950 flex items-center gap-4">
                <span>{formatCurrency(totalPendingUsd, "USD")}</span>
                <span className="text-amber-300">|</span>
                <span>{formatCurrency(totalPendingPen, "PEN")}</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-6xl mx-auto px-4 mt-12 pt-6 border-t text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600">{companyName} SAC • Operador Logístico Internacional & Agencia de Aduanas</p>
        <p className="mt-1">Atención al cliente & operaciones: Calle Españoletto 115, Dpto. 101, San Borja • Teléf: 969 3010 95</p>
      </footer>
    </div>
  );
}
