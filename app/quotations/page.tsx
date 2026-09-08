import Link from "next/link";
import { FileText, Plus, Calendar, User, TrendingUp } from "lucide-react";
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
import { ConvertQuotationButton } from "@/components/convert-quotation-button";

export const dynamic = "force-dynamic";

const statusVariantMap: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  ACCEPTED: "success",
  REJECTED: "destructive",
};

const statusLabelMap: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  ACCEPTED: "Aceptada / Operación",
  REJECTED: "Rechazada",
};

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: { client: true, operation: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cotizaciones & Rentabilidad</h1>
          <p className="text-sm text-slate-500">
            Control de cotizaciones bimonetarias (USD/PEN) y conversión a Operaciones Logísticas.
          </p>
        </div>
        <Link href="/quotations/new">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nueva Cotización
          </Button>
        </Link>
      </div>

      {/* Main Content Area */}
      {quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-purple-50 p-4 text-purple-600 mb-3">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No hay cotizaciones registradas</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Empieza registrando tu primera cotización bimonetaria para generar operaciones de despacho.
          </p>
          <div className="mt-4">
            <Link href="/quotations/new">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                <Plus className="mr-2 h-4 w-4" /> Crear Cotización
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid gap-4 md:hidden">
            {quotations.map((item) => (
              <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-900 text-base">{item.code}</span>
                  <Badge variant={statusVariantMap[item.status] || "secondary"}>
                    {statusLabelMap[item.status] || item.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{item.client.businessName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Válida hasta: {formatDate(item.validUntil)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Venta Total USD:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.totalUsd, "USD")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Venta Total PEN:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.totalPen, "PEN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> Profit Est.:
                    </span>
                    <span className="font-black text-emerald-700">
                      {formatCurrency(item.profitUsd, "USD")} / {formatCurrency(item.profitPen, "PEN")}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <Link href={`/quotations/${item.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold text-blue-600 border-blue-200">
                        <FileText className="mr-1 h-3.5 w-3.5" /> Ver / PDF
                      </Button>
                    </Link>
                    <ConvertQuotationButton
                      quotationId={item.id}
                      existingOperationId={item.operation?.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 text-left">Código</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">Cliente / Razón Social</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Venta USD ($)</TableHead>
                    <TableHead className="font-semibold text-emerald-700 text-right">Profit USD ($)</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Venta PEN (S/)</TableHead>
                    <TableHead className="font-semibold text-emerald-700 text-right">Profit PEN (S/)</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-slate-900 text-left">
                        <Link href={`/quotations/${item.id}`} className="text-blue-600 hover:underline">
                          {item.code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-left font-medium text-slate-800">
                        {item.client.businessName}
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge variant={statusVariantMap[item.status] || "secondary"}>
                          {statusLabelMap[item.status] || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(item.totalUsd, "USD")}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-600">
                        {formatCurrency(item.profitUsd, "USD")}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(item.totalPen, "PEN")}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-600">
                        {formatCurrency(item.profitPen, "PEN")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/quotations/${item.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50">
                              <FileText className="mr-1 h-3.5 w-3.5" /> PDF
                            </Button>
                          </Link>
                          <ConvertQuotationButton
                            quotationId={item.id}
                            existingOperationId={item.operation?.id}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
