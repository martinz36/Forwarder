import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ship, ShieldAlert, DollarSign, Wallet, FileText, CheckCircle2, TrendingUp, AlertCircle, FolderOpen } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { OperationHeaderForm } from "@/components/operation-header-form";
import { AddExtraChargeDialog } from "@/components/add-extra-charge-dialog";
import { BrokerDocumentSection } from "@/components/broker-document-section";
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

export const dynamic = "force-dynamic";

interface OperationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OperationDetailPage({ params }: OperationDetailPageProps) {
  const { id } = await params;

  const operation = await prisma.operation.findUnique({
    where: { id },
    include: {
      quotation: {
        include: { client: true },
      },
      charges: {
        orderBy: { createdAt: "asc" },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!operation) {
    notFound();
  }

  const baseCharges = operation.charges.filter((c) => !c.isExtraCharge);
  const extraCharges = operation.charges.filter((c) => c.isExtraCharge);

  // Financial totals calculation
  let realCostUsd = 0;
  let realSaleUsd = 0;
  let realCostPen = 0;
  let realSalePen = 0;

  operation.charges.forEach((charge) => {
    if (charge.currency === "PEN") {
      realCostPen += charge.totalCost;
      realSalePen += charge.totalPrice;
    } else {
      realCostUsd += charge.totalCost;
      realSaleUsd += charge.totalPrice;
    }
  });

  const realProfitUsd = realSaleUsd - realCostUsd;
  const realProfitPen = realSalePen - realCostPen;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/operations">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Operación {operation.quotation.code}
              </h1>
              {operation.customsChannel && (
                <Badge
                  className={
                    operation.customsChannel === "VERDE"
                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                      : operation.customsChannel === "NARANJA"
                      ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                      : "bg-red-500/15 text-red-700 border-red-500/30"
                  }
                >
                  CANAL {operation.customsChannel}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Cliente: <span className="font-semibold text-slate-800">{operation.quotation.client.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Operation Header Form Component */}
      <OperationHeaderForm
        operationId={operation.id}
        initialData={{
          status: operation.status,
          blNumber: operation.blNumber,
          etd: operation.etd,
          eta: operation.eta,
          customsChannel: operation.customsChannel,
        }}
      />

      {/* Shared Client Documents Section */}
      <div className="pt-2">
        <BrokerDocumentSection
          operationId={operation.id}
          sharedToken={operation.sharedToken}
          documents={operation.documents}
        />
      </div>

      {/* Base Charges Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Cargos Base (Cotización Heredada)
          </h2>
          <span className="text-xs text-slate-500 font-medium">{baseCharges.length} conceptos iniciales</span>
        </div>

        {/* Mobile View: Base Charges Cards */}
        <div className="grid gap-3 md:hidden">
          {baseCharges.map((charge) => (
            <div key={charge.id} className="rounded-xl border bg-white p-3.5 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-900 text-sm">{charge.description}</span>
                <Badge variant="outline" className="text-xs">
                  {charge.currency}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t pt-2">
                <div>
                  <span className="text-slate-400">Costo: </span>
                  <span className="font-medium">{formatCurrency(charge.totalCost, charge.currency as any)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Venta: </span>
                  <span className="font-bold text-slate-900">{formatCurrency(charge.totalPrice, charge.currency as any)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Base Charges Table */}
        <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 text-left">Concepto Base</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Moneda</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Cant.</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Costo Total</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Venta Total</TableHead>
                <TableHead className="font-semibold text-emerald-700 text-right">Profit Línea</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baseCharges.map((charge) => {
                const lineProfit = charge.totalPrice - charge.totalCost;
                return (
                  <TableRow key={charge.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-medium text-slate-900 text-left">{charge.description}</TableCell>
                    <TableCell className="text-center font-bold text-xs">{charge.currency}</TableCell>
                    <TableCell className="text-center">{charge.quantity}</TableCell>
                    <TableCell className="text-right text-slate-600 font-medium">
                      {formatCurrency(charge.totalCost, charge.currency as any)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(charge.totalPrice, charge.currency as any)}
                    </TableCell>
                    <TableCell className="text-right font-black text-emerald-600">
                      {formatCurrency(lineProfit, charge.currency as any)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Extra Charges (Sobrecostos) Section */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" /> Cargos Adicionales y Sobrecostos (Canal Rojo / Aforos / Almacenaje)
            </h2>
            <p className="text-xs text-slate-500">Gastos imprevistos surgidos durante el despacho aduanero.</p>
          </div>
          <AddExtraChargeDialog operationId={operation.id} />
        </div>

        {extraCharges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No se han registrado sobrecostos adicionales en esta operación.
          </div>
        ) : (
          <>
            {/* Mobile View: Extra Charges Cards */}
            <div className="grid gap-3 md:hidden">
              {extraCharges.map((charge) => (
                <div key={charge.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-amber-950 text-sm">{charge.description}</span>
                    <Badge className="bg-amber-600 text-white text-xs">
                      SOBRECOSTO ({charge.currency})
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-amber-200/60 pt-2">
                    <div>
                      <span className="text-slate-500">Costo: </span>
                      <span className="font-semibold text-slate-800">{formatCurrency(charge.totalCost, charge.currency as any)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Venta: </span>
                      <span className="font-bold text-amber-900">{formatCurrency(charge.totalPrice, charge.currency as any)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Extra Charges Table */}
            <div className="hidden md:block rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-amber-50/70">
                  <TableRow>
                    <TableHead className="font-semibold text-amber-900 text-left">Sobrecosto</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-center">Moneda</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-center">Cant.</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-right">Costo Total</TableHead>
                    <TableHead className="font-semibold text-amber-900 text-right">Venta Total</TableHead>
                    <TableHead className="font-semibold text-emerald-700 text-right">Profit Línea</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extraCharges.map((charge) => {
                    const lineProfit = charge.totalPrice - charge.totalCost;
                    return (
                      <TableRow key={charge.id} className="hover:bg-amber-50/30">
                        <TableCell className="font-semibold text-slate-900 text-left">{charge.description}</TableCell>
                        <TableCell className="text-center font-bold text-xs">{charge.currency}</TableCell>
                        <TableCell className="text-center">{charge.quantity}</TableCell>
                        <TableCell className="text-right text-slate-600 font-medium">
                          {formatCurrency(charge.totalCost, charge.currency as any)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-950">
                          {formatCurrency(charge.totalPrice, charge.currency as any)}
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600">
                          {formatCurrency(lineProfit, charge.currency as any)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Real Financial Profit Panel (Base + Extra Charges) */}
      <div className="rounded-2xl border bg-slate-950 text-white p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight">Resumen Financiero Real de la Operación</h3>
              <p className="text-xs text-slate-400">Suma consolidada de Cargos Base + Sobrecostos adicionales</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* USD Real Summary */}
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-blue-400" /> Moneda Dólares (USD)
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Costo Real Proveedores:</span>
                <span className="font-semibold text-slate-300 text-right">{formatCurrency(realCostUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Venta Real Cliente:</span>
                <span className="font-bold text-white text-right">{formatCurrency(realSaleUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 text-base">Profit Real USD:</span>
                <span className="font-black text-emerald-400 text-xl text-right">{formatCurrency(realProfitUsd, "USD")}</span>
              </div>
            </div>
          </div>

          {/* PEN Real Summary */}
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-purple-400" /> Moneda Soles (PEN)
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Costo Real Proveedores:</span>
                <span className="font-semibold text-slate-300 text-right">{formatCurrency(realCostPen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Venta Real Cliente:</span>
                <span className="font-bold text-white text-right">{formatCurrency(realSalePen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 text-base">Profit Real PEN:</span>
                <span className="font-black text-emerald-400 text-xl text-right">{formatCurrency(realProfitPen, "PEN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
