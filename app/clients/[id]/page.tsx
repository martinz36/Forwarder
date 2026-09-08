import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditClientDialog } from "@/components/edit-client-dialog";
import { ClientNotesSection } from "@/components/client-notes-section";

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

  const liquidations = operations
    .filter((op) => op.liquidation !== null)
    .map((op) => ({
      ...op.liquidation!,
      operationId: op.id,
      quotationCode: op.quotationCode,
      blNumber: op.blNumber,
    }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Navbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
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
            <p className="text-sm text-slate-500 mt-1">
              Perfil CRM 360° • Agenciamiento Aduanero y Logística Internacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <EditClientDialog client={client} />
        </div>
      </div>

      {/* Corporate Meta Header Card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm grid gap-4 sm:grid-cols-3 text-sm">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Persona de Contacto</span>
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <User className="h-4 w-4 text-blue-600 shrink-0" />
            {client.contactName || <span className="text-slate-400 font-normal">No asignada</span>}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Teléfono / Correo</span>
          {client.phone && (
            <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {client.phone}
            </p>
          )}
          {client.email && (
            <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {client.email}
            </p>
          )}
          {!client.phone && !client.email && <span className="text-slate-400 text-xs">Sin datos</span>}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dirección Fiscal</span>
          <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {client.address || <span className="text-slate-400 font-normal">No registrada</span>}
          </p>
        </div>
      </div>

      {/* 4 CRM Tabs Section */}
      <Tabs defaultValue="operaciones" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="operaciones" className="flex items-center gap-1.5">
            <Ship className="h-4 w-4" /> Operaciones ({operations.length})
          </TabsTrigger>
          <TabsTrigger value="cotizaciones" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Cotizaciones ({client.quotations.length})
          </TabsTrigger>
          <TabsTrigger value="estado-cuenta" className="flex items-center gap-1.5">
            <Receipt className="h-4 w-4" /> Estado de Cuenta ({liquidations.length})
          </TabsTrigger>
          <TabsTrigger value="notas" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Notas CRM ({client.notes.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Operaciones */}
        <TabsContent value="operaciones">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Ship className="h-5 w-5 text-blue-600" /> Operaciones Logísticas y Despachos
            </h3>

            {operations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Este cliente aún no tiene operaciones activas registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 text-left">Cotización / Ref</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">BL / HBL</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">ETA (Llegada)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Canal Aduana</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Estado</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((op) => (
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
                            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-blue-600 border-blue-200">
                              <Eye className="mr-1 h-3.5 w-3.5" /> Ver Operación
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
        </TabsContent>

        {/* Tab 2: Cotizaciones */}
        <TabsContent value="cotizaciones">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Historial de Cotizaciones
            </h3>

            {client.quotations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
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
                      <TableHead className="font-semibold text-emerald-700 text-right">Profit USD ($)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Venta PEN (S/)</TableHead>
                      <TableHead className="font-semibold text-emerald-700 text-right">Profit PEN (S/)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.quotations.map((q) => (
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
                        <TableCell className="text-right font-black text-emerald-600">
                          {formatCurrency(q.profitUsd, "USD")}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(q.totalPen, "PEN")}
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600">
                          {formatCurrency(q.profitPen, "PEN")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/quotations/${q.id}`}>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-blue-600 border-blue-200">
                              <FileText className="mr-1 h-3.5 w-3.5" /> Ver PDF
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
        </TabsContent>

        {/* Tab 3: Estado de Cuenta */}
        <TabsContent value="estado-cuenta">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" /> Estado de Cuenta y Liquidaciones
            </h3>

            {liquidations.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No hay liquidaciones o facturas registradas aún para este cliente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 text-left">Factura SUNAT</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-left">BL / Ref</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Facturable Con IGV (USD / PEN)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Reembolsos Inafectos (USD / PEN)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Total a Pagar (USD / PEN)</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Estado SUNAT</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liquidations.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell className="font-mono font-bold text-xs text-slate-900 text-left">
                          {liq.invoiceNumber ? (
                            <Badge className="bg-emerald-600 text-white font-mono">{liq.invoiceNumber}</Badge>
                          ) : (
                            <span className="text-slate-400 italic">Pendiente emisión</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium text-left">
                          {liq.blNumber || liq.quotationCode}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-900">
                          {formatCurrency(liq.totalTaxableUsd, "USD")} / {formatCurrency(liq.totalTaxablePen, "PEN")}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-900">
                          {formatCurrency(liq.totalNonTaxableUsd, "USD")} / {formatCurrency(liq.totalNonTaxablePen, "PEN")}
                        </TableCell>
                        <TableCell className="text-right font-black text-slate-900">
                          {formatCurrency(liq.grandTotalUsd, "USD")} / {formatCurrency(liq.grandTotalPen, "PEN")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              liq.status === "BILLED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }
                          >
                            {liq.status === "BILLED" ? "FACTURADO 🟢" : liq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/liquidations/${liq.id}`}>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-blue-600 border-blue-200">
                              <Receipt className="mr-1 h-3.5 w-3.5" /> Ver Liquidación
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
        </TabsContent>

        {/* Tab 4: Notas CRM */}
        <TabsContent value="notas">
          <ClientNotesSection clientId={client.id} notes={client.notes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
