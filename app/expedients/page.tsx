import Link from "next/link";
import { Folder, FolderPlus, ArrowRight, User, Calendar, FileText, Ship } from "lucide-react";
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
import { CreateExpedientDialog } from "@/components/create-expedient-dialog";

export const dynamic = "force-dynamic";

const expedientStatusMap: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Abierto", className: "bg-blue-100 text-blue-800 border-blue-200" },
  QUOTING: { label: "En Cotización", className: "bg-amber-100 text-amber-800 border-amber-200" },
  IN_TRANSIT: { label: "En Tránsito", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CLOSED: { label: "Cerrado", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default async function ExpedientsPage() {
  const expedients = await prisma.expedient.findMany({
    include: {
      client: true,
      quotations: {
        select: { id: true, code: true, status: true },
        orderBy: { createdAt: "desc" },
      },
      operations: {
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, businessName: true, documentNumber: true },
    orderBy: { businessName: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Folder className="h-6 w-6 text-blue-600" />
            <span>Expedientes y Routing Orders</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Punto de inicio operativo. Abre expedientes por cliente para coordinar cotizaciones y operaciones de importación.
          </p>
        </div>

        <CreateExpedientDialog clients={clients} />
      </div>

      {/* Main List */}
      {expedients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-blue-50 p-4 text-blue-600 mb-3">
            <Folder className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No hay expedientes registrados</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Comienza abriendo un nuevo expediente para un cliente importador.
          </p>
          <div className="mt-4">
            <CreateExpedientDialog clients={clients} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 text-left">Código Expediente</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-left">Cliente / Razón Social</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-left">Cotizaciones</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-left">Fecha Apertura</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expedients.map((exp) => {
                  const statusInfo = expedientStatusMap[exp.status] || {
                    label: exp.status,
                    className: "bg-slate-100 text-slate-700 border-slate-200",
                  };

                  return (
                    <TableRow key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-left font-bold text-blue-600">
                        <Link href={`/expedients/${exp.id}`} className="hover:underline">
                          {exp.code}
                        </Link>
                      </TableCell>

                      <TableCell className="text-left font-medium text-slate-900">
                        <div>{exp.client.businessName}</div>
                        <div className="text-xs text-slate-400 font-mono">{exp.client.documentNumber}</div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                      </TableCell>

                      <TableCell className="text-left text-xs">
                        {exp.quotations.length > 0 ? (
                          <div className="space-y-1">
                            {exp.quotations.map((q) => (
                              <Link
                                key={q.id}
                                href={`/quotations/${q.id}`}
                                className="inline-flex items-center gap-1 font-mono text-blue-600 hover:underline block"
                              >
                                <FileText className="h-3 w-3" /> {q.code}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin cotización</span>
                        )}
                      </TableCell>

                      <TableCell className="text-left text-xs text-slate-600">
                        {formatDate(exp.createdAt)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Link href={`/expedients/${exp.id}`}>
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                            <span>Ver Expediente</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
