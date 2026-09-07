import Link from "next/link";
import { Users, FileText, Ship, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";

export const revalidate = 0;

export default async function DashboardPage() {
  const [clientCount, quotationCount] = await Promise.all([
    prisma.client.count(),
    prisma.quotation.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Principal</h1>
        <p className="text-slate-500">Bienvenido al sistema ERP/CRM de Operaciones Aduaneras y Transporte Internacional.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Clientes Registrados</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{clientCount}</span>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              <TrendingUp className="mr-1 h-3 w-3" /> +100%
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Cotizaciones Emitidas</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">{quotationCount}</span>
            <span className="text-xs font-medium text-slate-400">Total en sistema</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Operaciones en Cursado</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Ship className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">0</span>
            <span className="text-xs font-medium text-slate-400">Activas</span>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Gestión de Clientes y RUCs</h2>
            <p className="text-sm text-slate-300">Administra la base de importadores/exportadores registrados y sus empresas.</p>
          </div>
          <Link href="/clients">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              Ir a Clientes <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
