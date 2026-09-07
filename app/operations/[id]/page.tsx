import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ship, ShieldAlert, DollarSign, Wallet, FileText, CheckCircle2, TrendingUp, AlertCircle, Receipt } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { OperationHeaderForm } from "@/components/operation-header-form";
import { AddExtraChargeDialog } from "@/components/add-extra-charge-dialog";
import { BrokerDocumentSection } from "@/components/broker-document-section";
import { OperationChargesManager } from "@/components/operation-charges-manager";
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
      liquidation: true,
    },
  });

  if (!operation) {
    notFound();
  }

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

        {operation.liquidation && (
          <Link href={`/liquidations/${operation.liquidation.id}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              <Receipt className="mr-1.5 h-4 w-4" /> Ver Liquidación Final
            </Button>
          </Link>
        )}
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

      {/* Operation Charges & IGV Manager (Taxable Toggles & Liquidation Generator) */}
      <div className="pt-2">
        <OperationChargesManager
          operationId={operation.id}
          charges={operation.charges}
          existingLiquidationId={operation.liquidation?.id}
        />
      </div>

      {/* Extra Charges Adder Button Section */}
      <div className="flex justify-end pt-2">
        <AddExtraChargeDialog operationId={operation.id} />
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
