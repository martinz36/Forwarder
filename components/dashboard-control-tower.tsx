"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Ship,
  Wallet,
  Target,
  FilePlus,
  ArrowRight,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  FolderPlus,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateExpedientDialog } from "@/components/create-expedient-dialog";

export interface MonthlyFinancialData {
  month: string;
  ventasUsd: number;
  costosUsd: number;
  profitUsd: number;
}

export interface ChannelDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface UpcomingArrivalItem {
  id: string;
  code: string;
  clientName: string;
  eta: Date | string | null;
  customsChannel: string | null;
  status: string;
  daysRemaining: number;
}

export interface PendingExpedientItem {
  id: string;
  code: string;
  clientName: string;
  loadType: string | null;
  createdAt: Date | string;
}

export interface PendingLiquidationItem {
  id: string;
  operationCode: string;
  clientName: string;
  grandTotalUsd: number;
  grandTotalPen: number;
  createdAt: Date | string;
}

interface DashboardControlTowerProps {
  kpis: {
    monthlyProfitUsd: number;
    monthlyProfitPen: number;
    activeOperationsCount: number;
    pendingReceivableUsd: number;
    pendingReceivablePen: number;
    conversionRatePercent: number;
    acceptedQuotationsCount: number;
    totalQuotationsLast30Days: number;
  };
  financialChartData: MonthlyFinancialData[];
  channelChartData: ChannelDistributionData[];
  upcomingArrivals: UpcomingArrivalItem[];
  pendingExpedients: PendingExpedientItem[];
  pendingLiquidations: PendingLiquidationItem[];
  clients: Array<{ id: string; businessName: string; documentNumber: string }>;
}

export function DashboardControlTower({
  kpis,
  financialChartData,
  channelChartData,
  upcomingArrivals,
  pendingExpedients,
  pendingLiquidations,
  clients,
}: DashboardControlTowerProps) {
  return (
    <div className="space-y-8 pb-12">
      {/* SECTION 1: HEADER & QUICK ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Torre de Control Logística y Financiera
            </h1>
            <Badge className="bg-blue-600 text-white font-semibold">
              REAL-TIME ERP
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoreo en tiempo real de operaciones de importación, margen financiero, arrobos y tareas prioritarias.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <CreateExpedientDialog clients={clients} />

          <Link href="/quotations/new">
            <Button variant="outline" className="font-semibold text-slate-700 border-slate-300 gap-2">
              <FilePlus className="h-4 w-4 text-blue-600" />
              <span>+ Nueva Cotización</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* SECTION 2: FINANCIAL & OPERATIONAL KPIS (GRID 4 CARDS) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Profit del Mes */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Profit Proyectado / Real
            </span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">
              {formatCurrency(kpis.monthlyProfitUsd, "USD")}
            </div>
            {kpis.monthlyProfitPen > 0 && (
              <div className="text-xs font-bold text-emerald-700 mt-0.5">
                + {formatCurrency(kpis.monthlyProfitPen, "PEN")}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 border-t">
            <span className="font-semibold text-emerald-600">Margen Neto</span> acumulado en operaciones activas
          </p>
        </div>

        {/* Card 2: Operaciones en Curso */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Operaciones en Curso
            </span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
              <Ship className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {kpis.activeOperationsCount} <span className="text-sm font-normal text-slate-500">Despachos</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 border-t">
            En tránsito marítimo, aéreo o en agenciamiento aduanero
          </p>
        </div>

        {/* Card 3: Por Cobrar / Facturado Pendiente */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Por Cobrar / Pendiente
            </span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 border border-amber-100">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">
              {formatCurrency(kpis.pendingReceivableUsd, "USD")}
            </div>
            {kpis.pendingReceivablePen > 0 && (
              <div className="text-xs font-bold text-amber-700 mt-0.5">
                + {formatCurrency(kpis.pendingReceivablePen, "PEN")}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 border-t">
            Monto total pendiente en liquidaciones no facturadas
          </p>
        </div>

        {/* Card 4: Tasa de Cierre / Conversión */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tasa de Cierre (30D)
            </span>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 border border-purple-100">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-600">
              {kpis.conversionRatePercent}%
            </div>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 border-t">
            <span className="font-semibold text-slate-800">{kpis.acceptedQuotationsCount} de {kpis.totalQuotationsLast30Days}</span> cotizaciones aceptadas
          </p>
        </div>
      </div>

      {/* SECTION 3: RECHARTS / INTERACTIVE CHARTS */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Financial Bar Chart */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span>Rendimiento Financiero Mensual (USD $)</span>
              </h3>
              <p className="text-xs text-slate-500">Comparativa de Ventas vs Costos de Proveedores (Últimos 6 Meses)</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {financialChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Sin datos financieros suficientes para mostrar el gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val), "USD")}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                  <Bar dataKey="ventasUsd" name="Ventas Totales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profitUsd" name="Profit Neto" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Customs Channels Pie Chart */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                <span>Distribución por Canal de Aduana (SUNAT)</span>
              </h3>
              <p className="text-xs text-slate-500">Histórico de canales otorgados en despachos aduaneros</p>
            </div>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {channelChartData.every((d) => d.value === 0) ? (
              <div className="text-xs text-slate-400 italic">
                Sin despachos aduaneros asignados actualmente.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} Operaciones`, "Cantidad"]} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: PRIORITY ACTION TABLES */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Table: Upcoming Arrivals (ETA < 7 days) */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span>Próximos Arribos (ETA)</span>
              </h3>
              <p className="text-xs text-slate-500">Despachos programados para llegar próximamente</p>
            </div>
            <Link href="/operations">
              <Button size="sm" variant="ghost" className="text-xs text-blue-600 font-semibold gap-1">
                <span>Ver todas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {upcomingArrivals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-xs text-slate-500">
              No hay arribos programados en los próximos días.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingArrivals.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    item.daysRemaining <= 3
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-slate-50/50 border-slate-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/operations/${item.id}`}
                        className="font-bold text-blue-600 hover:underline text-sm"
                      >
                        {item.code}
                      </Link>
                      {item.customsChannel && (
                        <Badge
                          className={
                            item.customsChannel === "VERDE"
                              ? "bg-emerald-100 text-emerald-800 text-[10px]"
                              : item.customsChannel === "NARANJA"
                              ? "bg-amber-100 text-amber-800 text-[10px]"
                              : "bg-red-100 text-red-800 text-[10px]"
                          }
                        >
                          {item.customsChannel}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 truncate max-w-xs">{item.clientName}</p>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Llegada ETA</span>
                      <span
                        className={`font-bold block ${
                          item.daysRemaining <= 3 ? "text-amber-700 font-black" : "text-slate-800"
                        }`}
                      >
                        {formatDate(item.eta)}
                      </span>
                    </div>

                    <Link href={`/operations/${item.id}`}>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Table: Priority Tasks / Pending Expedients & Liquidations */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Tareas Prioritarias & Alertas</span>
              </h3>
              <p className="text-xs text-slate-500">Expedientes sin cotizar y liquidaciones pendientes</p>
            </div>
          </div>

          {pendingExpedients.length === 0 && pendingLiquidations.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>¡Todo al día! No hay expedientes colgados ni liquidaciones pendientes.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending Expedients */}
              {pendingExpedients.map((exp) => (
                <div key={exp.id} className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white text-[10px]">EXPEDIENTE SIN COTIZAR</Badge>
                      <span className="font-bold text-slate-900">{exp.code}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{exp.clientName}</p>
                    <span className="text-[10px] text-slate-500 block">Abierto {formatDate(exp.createdAt)}</span>
                  </div>

                  <Link href={`/quotations/new?expedientId=${exp.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1">
                      <FilePlus className="h-3.5 w-3.5" />
                      <span>Cotizar</span>
                    </Button>
                  </Link>
                </div>
              ))}

              {/* Pending Liquidations */}
              {pendingLiquidations.map((liq) => (
                <div key={liq.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600 text-white text-[10px]">LIQUIDACIÓN PENDIENTE</Badge>
                      <span className="font-bold text-slate-900">{liq.operationCode}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{liq.clientName}</p>
                    <span className="text-[10px] font-bold text-amber-800 block">
                      Total: {formatCurrency(liq.grandTotalUsd, "USD")}
                    </span>
                  </div>

                  <Link href={`/liquidations/${liq.id}`}>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold">
                      <span>Ver Liquidación</span>
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
