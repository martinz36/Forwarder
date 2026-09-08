import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  Clock,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Receipt,
  Ship,
  TrendingUp,
  User,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { ClientNotesSection } from "@/components/client-notes-section";
import { ClientDocumentsRepository } from "@/components/client-documents-repository";

export const dynamic = "force-dynamic";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      quotations: {
        include: {
          operation: {
            include: {
              liquidation: true,
              documents: {
                orderBy: { uploadedAt: "desc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      notes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Extract Operations and Liquidations from Quotations
  const operations = client.quotations
    .filter((q) => q.operation !== null)
    .map((q) => ({
      ...q.operation!,
      quotationCode: q.code,
    }));

  const activeOperations = operations.filter((op) => op.status !== "LIQUIDADO");
  const recentActiveOperations = activeOperations.slice(0, 5);
  const recentQuotations = client.quotations.slice(0, 5);

  const liquidations = operations
    .filter((op) => op.liquidation !== null)
    .map((op) => ({
      ...op.liquidation!,
      operationId: op.id,
      quotationCode: op.quotationCode,
      blNumber: op.blNumber,
    }));

  const allClientDocuments = operations
    .flatMap((op) =>
      (op.documents || []).map((doc) => ({
        ...doc,
        operationCode: op.quotationCode,
        blNumber: op.blNumber,
      }))
    )
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  // KPI Calculations
  const activeOpsCount = activeOperations.length;

  const pendingDebtUsd = liquidations
    .filter((l) => l.status !== "BILLED")
    .reduce((sum, l) => sum + (l.grandTotalUsd || 0), 0);

  const pendingDebtPen = liquidations
    .filter((l) => l.status !== "BILLED")
    .reduce((sum, l) => sum + (l.grandTotalPen || 0), 0);

  const billedTotalUsd = liquidations
    .filter((l) => l.status === "BILLED")
    .reduce((sum, l) => sum + (l.grandTotalUsd || 0), 0);

  const billedTotalPen = liquidations
    .filter((l) => l.status === "BILLED")
    .reduce((sum, l) => sum + (l.grandTotalPen || 0), 0);

  // Phone clean for WhatsApp
  const cleanPhone = client.phone ? client.phone.replace(/\D/g, "") : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Row 1: Header Nav & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {client.businessName}
              </h1>
              <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50 font-mono font-bold text-xs">
                {client.documentType}: {client.documentNumber}
              </Badge>
              <Badge variant={client.status === "ACTIVE" ? "success" : "secondary"}>
                {client.status === "ACTIVE" ? "Activo" : client.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dashboard Bento 360° • Agenciamiento Aduanero y Logística Internacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <EditClientDialog client={client} />
          <Link href={`/quotations/new?clientId=${client.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 flex items-center gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Nueva Cotización
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1.5: Corporate Meta Header Card */}
      <div className="rounded-xl border bg-white p-5 shadow-sm grid gap-4 sm:grid-cols-3 text-sm">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Persona de Contacto</span>
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <User className="h-4 w-4 text-blue-600 shrink-0" />
            {client.contactName || <span className="text-slate-400 font-normal">No asignada</span>}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Canales de Contacto</span>
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {client.phone ? (
              <a
                href={cleanPhone ? `https://wa.me/${cleanPhone}` : `tel:${client.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors"
              >
                <Phone className="h-3 w-3 text-emerald-600" /> {client.phone}
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              </a>
            ) : null}

            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition-colors"
              >
                <Mail className="h-3 w-3 text-blue-600" /> {client.email}
              </a>
            ) : null}

            {!client.phone && !client.email && (
              <span className="text-slate-400 text-xs">Sin datos registrados</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dirección Fiscal</span>
          <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {client.address || <span className="text-slate-400 font-normal">No registrada</span>}
          </p>
        </div>
      </div>

      {/* Row 2: KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Active Operations */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operaciones en Curso</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ship className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeOpsCount}</span>
            <span className="text-xs text-slate-500">activas</span>
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t">
            {operations.length} despachos históricos en total
          </p>
        </div>

        {/* KPI 2: Pending Debt */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Deuda Pendiente / Por Liquidar</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-2xl font-black text-amber-900">
              {formatCurrency(pendingDebtUsd, "USD")}
            </div>
            {pendingDebtPen > 0 && (
              <div className="text-xs font-bold text-amber-700">
                + {formatCurrency(pendingDebtPen, "PEN")}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t">
            Liquidaciones en estado Borrador o Pendiente
          </p>
        </div>

        {/* KPI 3: Total Billed */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Valor Histórico Facturado</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-2xl font-black text-emerald-900">
              {formatCurrency(billedTotalUsd, "USD")}
            </div>
            {billedTotalPen > 0 && (
              <div className="text-xs font-bold text-emerald-700">
                + {formatCurrency(billedTotalPen, "PEN")}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 pt-1 border-t">
            Comprobantes SUNAT emitidos y concluidos
          </p>
        </div>
      </div>

      {/* Row 3: Bento Grid Layout (2 cols Left, 1 col Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Block A: Active Operations */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Operaciones Activas en Curso</h3>
              </div>
              <Link href="/operations" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Ver todo el historial <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentActiveOperations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed">
                Este cliente no tiene operaciones activas en curso.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 text-left">Cotización / Ref</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">BL / HBL</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">ETA Llegada</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Canal</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActiveOperations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell className="font-bold text-blue-600 text-left">
                          {op.quotationCode}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-800 text-left">
                          {op.blNumber || <span className="text-slate-400 italic">Por asignar</span>}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 text-left">
                          {formatDate(op.eta)}
                        </TableCell>
                        <TableCell className="text-center">
                          {op.customsChannel ? (
                            <Badge
                              className={
                                op.customsChannel === "VERDE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : op.customsChannel === "NARANJA"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {op.customsChannel}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">Sin canal</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-medium text-xs">
                            {op.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/operations/${op.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs font-semibold text-blue-600 border-blue-200 px-2.5">
                              <Eye className="mr-1 h-3 w-3" /> Ver
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Block B: Recent Quotations */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Últimas Cotizaciones</h3>
              </div>
              <Link href="/quotations" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Ver todo el historial <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentQuotations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed">
                No hay cotizaciones registradas para este cliente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 text-left">Código</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">Fecha</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">Estado</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Venta USD ($)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Venta PEN (S/)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentQuotations.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-bold text-blue-600 text-left">{q.code}</TableCell>
                        <TableCell className="text-xs text-slate-500 text-left">{formatDate(q.createdAt)}</TableCell>
                        <TableCell className="text-left">
                          <Badge variant="secondary" className="font-semibold text-xs">
                            {q.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(q.totalUsd, "USD")}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(q.totalPen, "PEN")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/quotations/${q.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs font-semibold text-blue-600 border-blue-200 px-2.5">
                              <FileText className="mr-1 h-3 w-3" /> Ver
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Block C: Integrated Client Document Repository */}
          <ClientDocumentsRepository documents={allClientDocuments} />
        </div>

        {/* Right Column (1 Col wide on Desktop) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Block C: Account State / Liquidations */}
          <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Estado de Cuenta</h3>
              </div>
              <Link href="/liquidations" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {liquidations.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed">
                No hay liquidaciones registradas.
              </div>
            ) : (
              <div className="space-y-3">
                {liquidations.slice(0, 5).map((liq) => (
                  <div
                    key={liq.id}
                    className="p-3 rounded-lg border bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {liq.invoiceNumber ? (
                          <Badge className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 py-0">
                            {liq.invoiceNumber}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 font-normal text-[10px] px-1.5 py-0">
                            {liq.status}
                          </Badge>
                        )}
                        <span className="font-semibold text-slate-700">
                          {liq.blNumber || liq.quotationCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Total a pagar
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <p className="font-black text-slate-900">
                        {formatCurrency(liq.grandTotalUsd, "USD")}
                      </p>
                      {liq.grandTotalPen > 0 && (
                        <p className="font-bold text-slate-600">
                          {formatCurrency(liq.grandTotalPen, "PEN")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Block D: CRM Notes Section */}
          <ClientNotesSection clientId={client.id} notes={client.notes} />
        </div>
      </div>
    </div>
  );
}
