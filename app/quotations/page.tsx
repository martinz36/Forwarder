import Link from "next/link";
import { FileText, Plus, Calendar, User, DollarSign, Coins } from "lucide-react";
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
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
};

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cotizaciones de Servicios</h1>
          <p className="text-sm text-slate-500">
            Cotizaciones bimonetarias (USD/PEN) creadas para agenciamiento de aduanas y transporte internacional.
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
            Empieza registrando tu primera cotización bimonetaria con ítems en dólares o soles.
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
                    <span className="font-medium truncate">{item.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Válida hasta: {formatDate(item.validUntil)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
                  <div className="text-xs text-slate-500 font-medium">Totales</div>
                  <div className="text-right space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm">{formatCurrency(item.totalUsd, "USD")}</div>
                    <div className="font-semibold text-emerald-700 text-xs">{formatCurrency(item.totalPen, "PEN")}</div>
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
                    <TableHead className="font-semibold text-slate-700 text-left">Válida Hasta</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Total USD ($)</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Total PEN (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-slate-900 text-left">
                        {item.code}
                      </TableCell>
                      <TableCell className="text-left font-medium text-slate-800">
                        {item.client.name}
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge variant={statusVariantMap[item.status] || "secondary"}>
                          {statusLabelMap[item.status] || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-left text-sm text-slate-600">
                        {formatDate(item.validUntil)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(item.totalUsd, "USD")}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        {formatCurrency(item.totalPen, "PEN")}
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
