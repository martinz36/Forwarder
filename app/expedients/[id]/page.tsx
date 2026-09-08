import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, FilePlus, User, Calendar, FileText, Ship, MapPin } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface ExpedientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExpedientDetailPage({ params }: ExpedientDetailPageProps) {
  const { id } = await params;

  const expedient = await prisma.expedient.findUnique({
    where: { id },
    include: {
      client: true,
      quotations: {
        include: {
          items: true,
          operation: true,
        },
        orderBy: { createdAt: "desc" },
      },
      operations: {
        include: {
          quotation: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!expedient) {
    notFound();
  }

  const { client } = expedient;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/expedients">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Expediente {expedient.code}
              </h1>
              <Badge className="bg-blue-600 text-white font-semibold">
                ESTADO: {expedient.status}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Cliente: <span className="font-semibold text-slate-800">{client.businessName}</span> ({client.documentNumber})
            </p>
          </div>
        </div>

        {/* Primary Action Button: Generar Cotización */}
        <Link href={`/quotations/new?expedientId=${expedient.id}`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow gap-2">
            <FilePlus className="h-4 w-4" />
            <span>Generar Cotización para este Expediente</span>
          </Button>
        </Link>
      </div>

      {/* Main Info Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Client & Expedient Summary Card */}
        <div className="md:col-span-1 rounded-2xl border bg-white p-5 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Información del Cliente</span>
            </h3>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div>
              <span className="text-slate-400 block font-medium">Razón Social:</span>
              <span className="font-bold text-slate-900 text-sm block">{client.businessName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">RUC / Documento:</span>
              <span className="font-mono">{client.documentType}: {client.documentNumber}</span>
            </div>
            {client.address && (
              <div>
                <span className="text-slate-400 block font-medium">Dirección:</span>
                <span className="flex items-start gap-1">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>{client.address}</span>
                </span>
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-slate-400 block font-medium">Teléfono:</span>
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div>
                <span className="text-slate-400 block font-medium">Email:</span>
                <span>{client.email}</span>
              </div>
            )}
            <div className="pt-2 border-t text-slate-500">
              <span className="text-slate-400 block font-medium">Fecha de Apertura:</span>
              <span>{formatDate(expedient.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Linked Quotations & Operations List */}
        <div className="md:col-span-2 space-y-6">
          {/* Quotations Section */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Cotizaciones Vinculadas ({expedient.quotations.length})</span>
              </h3>

              <Link href={`/quotations/new?expedientId=${expedient.id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <FilePlus className="h-3.5 w-3.5" /> Nueva
                </Button>
              </Link>
            </div>

            {expedient.quotations.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed text-xs text-slate-500">
                Aún no hay cotizaciones emitidas para este expediente. Haz clic en <strong>"Generar Cotización"</strong> para cotizar el servicio al cliente.
              </div>
            ) : (
              <div className="space-y-3">
                {expedient.quotations.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl border bg-slate-50/50 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <Link href={`/quotations/${q.id}`} className="font-bold text-blue-600 hover:underline block">
                        {q.code}
                      </Link>
                      <span className="text-xs text-slate-500">
                        Total USD: <strong>{formatCurrency(q.totalUsd, "USD")}</strong> • {formatDate(q.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{q.status}</Badge>
                      <Link href={`/quotations/${q.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs">
                          Ver Cotización
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operations Section */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
            <div className="border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Ship className="h-4 w-4 text-emerald-600" />
                <span>Operaciones en Curso ({expedient.operations.length})</span>
              </h3>
            </div>

            {expedient.operations.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed text-xs text-slate-500">
                Las operaciones se generan automáticamente una vez aprobada una cotización.
              </div>
            ) : (
              <div className="space-y-3">
                {expedient.operations.map((op) => (
                  <div key={op.id} className="p-4 rounded-xl border bg-slate-50/50 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <Link href={`/operations/${op.id}`} className="font-bold text-blue-600 hover:underline block">
                        {op.id}
                      </Link>
                      <span className="text-xs text-slate-500">
                        Estado: <strong>{op.status}</strong>
                      </span>
                    </div>

                    <Link href={`/operations/${op.id}`}>
                      <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        Ver Operación
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
