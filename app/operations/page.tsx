import Link from "next/link";
import { Ship, Calendar, User, Eye, FileText } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDate } from "@/lib/format";
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

const statusLabelMap: Record<string, string> = {
  EN_TRANSITO: "En Tránsito",
  EN_ADUANA: "En Aduana",
  RETIRADO: "Retirado",
  LIQUIDADO: "Liquidado",
};

const statusVariantMap: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  EN_TRANSITO: "default",
  EN_ADUANA: "secondary",
  RETIRADO: "success",
  LIQUIDADO: "outline",
};

export default async function OperationsPage() {
  const operations = await prisma.operation.findMany({
    include: {
      quotation: {
        include: { client: true },
      },
      charges: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operaciones y Despachos Aduaneros</h1>
          <p className="text-sm text-slate-500">
            Seguimiento de despachos aduaneros, canal de aduana (Verde/Naranja/Rojo) y control de sobrecostos.
          </p>
        </div>
      </div>

      {/* Main List */}
      {operations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-amber-50 p-4 text-amber-600 mb-3">
            <Ship className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No hay operaciones activas</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Para iniciar una operación, aprueba una cotización desde el módulo de Cotizaciones.
          </p>
          <div className="mt-4">
            <Link href="/quotations">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                Ir a Cotizaciones <FileText className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {operations.map((op) => (
              <div key={op.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{op.quotation.code}</span>
                    {op.customsChannel && (
                      <Badge
                        className={
                          op.customsChannel === "VERDE"
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                            : op.customsChannel === "NARANJA"
                            ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                            : "bg-red-500/15 text-red-700 border-red-500/30"
                        }
                      >
                        CANAL {op.customsChannel}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={statusVariantMap[op.status] || "secondary"}>
                    {statusLabelMap[op.status] || op.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{op.quotation.client.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <span className="font-semibold text-slate-500">BL / HBL:</span>
                    <span>{op.blNumber || "Pendiente asignación"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>ETA: {formatDate(op.eta)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Link href={`/operations/${op.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs">
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Detalle
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 text-left">Código / Cotización</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">Cliente / Razón Social</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">BL / HBL</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">ETA (Llegada)</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Canal Aduana</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-slate-900 text-left">
                        {op.quotation.code}
                      </TableCell>
                      <TableCell className="text-left font-medium text-slate-800">
                        {op.quotation.client.name}
                      </TableCell>
                      <TableCell className="text-left text-sm font-mono text-slate-700">
                        {op.blNumber || <span className="text-slate-400 italic">Por asignar</span>}
                      </TableCell>
                      <TableCell className="text-left text-sm text-slate-600">
                        {formatDate(op.eta)}
                      </TableCell>
                      <TableCell className="text-center">
                        {op.customsChannel ? (
                          <Badge
                            className={
                              op.customsChannel === "VERDE"
                                ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                                : op.customsChannel === "NARANJA"
                                ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                                : "bg-red-500/15 text-red-700 border-red-500/30"
                            }
                          >
                            CANAL {op.customsChannel}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Por determinar</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariantMap[op.status] || "secondary"}>
                          {statusLabelMap[op.status] || op.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/operations/${op.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs">
                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Detalle
                          </Button>
                        </Link>
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
