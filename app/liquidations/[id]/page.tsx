import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt, Printer, FileText, CheckCircle2, ShieldAlert, Sparkles, Building2, User, Calendar, MapPin } from "lucide-react";
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

import { EmitInvoiceButton } from "@/components/emit-invoice-button";

export const dynamic = "force-dynamic";

interface LiquidationPageProps {
  params: Promise<{ id: string }>;
}

export default async function LiquidationDetailPage({ params }: LiquidationPageProps) {
  const { id } = await params;

  const liquidation = await prisma.liquidation.findUnique({
    where: { id },
    include: {
      operation: {
        include: {
          quotation: {
            include: { client: true },
          },
          charges: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!liquidation) {
    notFound();
  }

  const { operation } = liquidation;
  const { quotation } = operation;
  const { client } = quotation;

  const taxableCharges = operation.charges.filter((c) => c.isTaxable);
  const nonTaxableCharges = operation.charges.filter((c) => !c.isTaxable);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Action Header Navbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/operations/${operation.id}`}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Liquidación de Gastos Operativos
              </h1>
              <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                LIQUIDACIÓN #{liquidation.id.slice(-6).toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Expediente: <span className="font-semibold text-slate-800">{quotation.code}</span> • Cliente: <span className="font-semibold text-slate-800">{client.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive SUNAT Invoicing Card */}
      <EmitInvoiceButton
        liquidationId={liquidation.id}
        status={liquidation.status}
        invoiceNumber={liquidation.invoiceNumber}
        sunatPdfUrl={liquidation.sunatPdfUrl}
        sunatCdrStatus={liquidation.sunatCdrStatus}
        sunatNotes={liquidation.sunatNotes}
      />

      {/* Official Liquidation Document Card */}
      <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-8">
        {/* Document Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-black text-xl">
              <Building2 className="h-6 w-6" />
              <span>AGENCIA DE ADUANAS & LOGÍSTICA S.A.C.</span>
            </div>
            <p className="text-xs text-slate-500">RUC: 20601234567 • Callao, Perú</p>
            <p className="text-xs text-slate-500">Atención a Operaciones de Comercio Exterior</p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <Badge variant="outline" className="text-xs font-bold border-slate-300">
              ESTADO: {liquidation.status}
            </Badge>
            <h3 className="font-mono font-bold text-slate-900 text-base">
              BL: {operation.blNumber || "N/A"}
            </h3>
            <p className="text-xs text-slate-500">
              Fecha de Emisión: {formatDate(liquidation.createdAt)}
            </p>
          </div>
        </div>

        {/* Client & Operations Meta Grid */}
        <div className="grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border text-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Facturar A (Cliente)</span>
            <p className="font-bold text-slate-900">{client.name}</p>
            {client.address && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {client.address}
              </p>
            )}
            {client.phone && <p className="text-xs text-slate-500">Tel: {client.phone}</p>}
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Detalles del Despacho</span>
            <p className="font-semibold text-slate-800">Canal Aduana: {operation.customsChannel || "VERDE"}</p>
            <p className="text-xs text-slate-600">ETA Llegada: {formatDate(operation.eta)}</p>
          </div>
        </div>

        {/* Table 1: Conceptos Facturables (Afectos a IGV 18%) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> 1. Servicios Facturables del Broker (Afectos a IGV 18%)
            </h3>
            <Badge className="bg-blue-100 text-blue-800 text-xs font-semibold">
              Sujeto a IGV (18%)
            </Badge>
          </div>

          {taxableCharges.length === 0 ? (
            <div className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-lg">
              No hay conceptos afectos al IGV en esta liquidación.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 text-left">Concepto Facturable</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Moneda</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Cant.</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Precio Unit.</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Subtotal Venta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxableCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium text-slate-900 text-left">{charge.description}</TableCell>
                      <TableCell className="text-center font-bold text-xs">{charge.currency}</TableCell>
                      <TableCell className="text-center">{charge.quantity}</TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatCurrency(charge.unitPrice, charge.currency as any)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(charge.totalPrice, charge.currency as any)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Taxable Subtotals & 18% IGV Breakdown */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2 text-sm max-w-md ml-auto">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal Afecto (USD / PEN):</span>
              <span className="font-semibold text-slate-800 text-right">
                {formatCurrency(liquidation.subtotalTaxableUsd, "USD")} / {formatCurrency(liquidation.subtotalTaxablePen, "PEN")}
              </span>
            </div>
            <div className="flex justify-between items-center text-blue-700 font-bold">
              <span>IGV (18% Ley Peruana):</span>
              <span className="text-right">
                {formatCurrency(liquidation.igvUsd, "USD")} / {formatCurrency(liquidation.igvPen, "PEN")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-200 text-slate-900 font-black">
              <span>Total Facturable (Con IGV):</span>
              <span className="text-right">
                {formatCurrency(liquidation.totalTaxableUsd, "USD")} / {formatCurrency(liquidation.totalTaxablePen, "PEN")}
              </span>
            </div>
          </div>
        </div>

        {/* Table 2: Pagos por Cuenta de Terceros (Inafectos / Reembolsos) */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-600" /> 2. Pagos por Cuenta de Terceros (Reembolsos Inafectos)
            </h3>
            <Badge className="bg-amber-100 text-amber-800 text-xs font-semibold">
              Sin IGV (Reembolso exacto)
            </Badge>
          </div>

          {nonTaxableCharges.length === 0 ? (
            <div className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-lg">
              No hay pagos por cuenta de terceros registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-amber-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-amber-900 text-left">Reembolso / Pago Terceros</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-center">Moneda</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-center">Cant.</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-right">Monto Unit.</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-right">Total Reembolso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonTaxableCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-semibold text-slate-900 text-left">{charge.description}</TableCell>
                      <TableCell className="text-center font-bold text-xs">{charge.currency}</TableCell>
                      <TableCell className="text-center">{charge.quantity}</TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatCurrency(charge.unitPrice, charge.currency as any)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-950">
                        {formatCurrency(charge.totalPrice, charge.currency as any)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-2 text-sm max-w-md ml-auto">
            <div className="flex justify-between items-center text-amber-900 font-bold">
              <span>Total Reembolsos Inafectos:</span>
              <span className="text-right">
                {formatCurrency(liquidation.totalNonTaxableUsd, "USD")} / {formatCurrency(liquidation.totalNonTaxablePen, "PEN")}
              </span>
            </div>
          </div>
        </div>

        {/* Grand Total Summary Box (Total a Pagar por el Cliente) */}
        <div className="rounded-2xl border bg-slate-950 text-white p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-xl leading-tight text-white">
                Resumen Final - Total a Pagar por el Cliente
              </h3>
              <p className="text-xs text-slate-400">
                Suma consolidada de Servicios Facturables (con IGV 18%) + Reembolsos Inafectos
              </p>
            </div>
            <Badge className="bg-emerald-500 text-slate-950 text-xs font-extrabold px-3 py-1 self-start sm:self-auto">
              MONTO FINAL LIQUIDADO
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* USD Grand Total */}
            <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total a Pagar en Dólares (USD $)
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Facturable Afecto + IGV:</span>
                  <span className="font-medium text-slate-200">{formatCurrency(liquidation.totalTaxableUsd, "USD")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reembolso Inafecto:</span>
                  <span className="font-medium text-slate-200">{formatCurrency(liquidation.totalNonTaxableUsd, "USD")}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-white text-sm">TOTAL USD:</span>
                <span className="font-black text-emerald-400 text-2xl text-right">
                  {formatCurrency(liquidation.grandTotalUsd, "USD")}
                </span>
              </div>
            </div>

            {/* PEN Grand Total */}
            <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total a Pagar en Soles (PEN S/)
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Facturable Afecto + IGV:</span>
                  <span className="font-medium text-slate-200">{formatCurrency(liquidation.totalTaxablePen, "PEN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reembolso Inafecto:</span>
                  <span className="font-medium text-slate-200">{formatCurrency(liquidation.totalNonTaxablePen, "PEN")}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-white text-sm">TOTAL PEN:</span>
                <span className="font-black text-emerald-400 text-2xl text-right">
                  {formatCurrency(liquidation.grandTotalPen, "PEN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
