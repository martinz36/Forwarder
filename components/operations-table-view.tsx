"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Ship,
  Search,
  User,
  Calendar,
  TriangleAlert,
  FileText,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationActionsMenu } from "@/components/operation-actions-menu";

export interface OperationChargeItem {
  id: string;
  currency: string;
  totalPrice: number;
  isExtraCharge: boolean;
}

export interface OperationWithDetails {
  id: string;
  status: string;
  blNumber: string | null;
  etd: Date | string | null;
  eta: Date | string | null;
  customsChannel: "VERDE" | "NARANJA" | "ROJO" | null;
  sharedToken: string;
  createdAt: Date | string;
  quotation: {
    id: string;
    code: string;
    client: {
      id: string;
      businessName: string;
      documentNumber?: string | null;
    };
  };
  charges: OperationChargeItem[];
  liquidation?: {
    id: string;
    status: string;
  } | null;
}

interface OperationsTableViewProps {
  operations: OperationWithDetails[];
}

const statusLabelMap: Record<string, string> = {
  EN_TRANSITO: "En Tránsito",
  EN_ADUANA: "En Aduana",
  RETIRADO: "Retirado",
  LIQUIDADO: "Liquidado",
};

export function OperationsTableView({ operations }: OperationsTableViewProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "IN_PROGRESS" | "LIQUIDATED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Tab count calculations
  const counts = useMemo(() => {
    const total = operations.length;
    const inProgress = operations.filter((op) => op.status !== "LIQUIDADO").length;
    const liquidated = operations.filter((op) => op.status === "LIQUIDADO").length;
    return { total, inProgress, liquidated };
  }, [operations]);

  // Filter logic
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      // Tab status filter
      if (activeTab === "IN_PROGRESS" && op.status === "LIQUIDADO") {
        return false;
      }
      if (activeTab === "LIQUIDATED" && op.status !== "LIQUIDADO") {
        return false;
      }

      // Search term filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const opCode = op.id.toLowerCase();
      const quotCode = op.quotation.code.toLowerCase();
      const clientName = op.quotation.client.businessName.toLowerCase();
      const bl = (op.blNumber || "").toLowerCase();

      return (
        opCode.includes(term) ||
        quotCode.includes(term) ||
        clientName.includes(term) ||
        bl.includes(term)
      );
    });
  }, [operations, activeTab, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header Bar with Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border shadow-sm">
        {/* Quick Filter Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="ALL" className="gap-2">
              <span>Todas</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 font-bold">
                {counts.total}
              </span>
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" className="gap-2">
              <span>En Curso</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 font-bold">
                {counts.inProgress}
              </span>
            </TabsTrigger>
            <TabsTrigger value="LIQUIDATED" className="gap-2">
              <span>Liquidadas</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 font-bold">
                {counts.liquidated}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar OP, Cotización, Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Main List Body */}
      {filteredOperations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="rounded-full bg-amber-50 p-4 text-amber-600 mb-3">
            <Ship className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">
            No se encontraron operaciones
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {searchTerm
              ? "No hay resultados que coincidan con la búsqueda actual."
              : "No hay operaciones registradas en esta categoría."}
          </p>
          {activeTab !== "ALL" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setActiveTab("ALL");
                setSearchTerm("");
              }}
            >
              Ver todas las operaciones
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {filteredOperations.map((op) => {
              const opDisplayCode = op.id.startsWith("OP-")
                ? op.id
                : `OP-${op.quotation.code.replace(/^COT-/, "")}`;

              let totalUsd = 0;
              let totalPen = 0;
              let hasExtraCharge = false;

              op.charges.forEach((c) => {
                if (c.isExtraCharge) hasExtraCharge = true;
                if (c.currency === "PEN") {
                  totalPen += c.totalPrice;
                } else {
                  totalUsd += c.totalPrice;
                }
              });

              return (
                <div
                  key={op.id}
                  className="rounded-xl border bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <Link
                        href={`/operations/${op.id}`}
                        className="font-bold text-blue-600 hover:underline text-base block"
                      >
                        {opDisplayCode}
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">
                        Origen: {op.quotation.code}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      className={
                        op.status === "EN_TRANSITO"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : op.status === "EN_ADUANA"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : op.status === "RETIRADO"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }
                    >
                      {statusLabelMap[op.status] || op.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* Client */}
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {op.quotation.client.businessName}
                      </span>
                    </div>

                    {/* Dates ETD / ETA */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block font-semibold">Salida (ETD):</span>
                        <span>{formatDate(op.etd)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Llegada (ETA):</span>
                        <span>{formatDate(op.eta)}</span>
                      </div>
                    </div>

                    {/* Customs Channel */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500 font-medium">Canal Aduana:</span>
                      {op.customsChannel ? (
                        <Badge
                          className={
                            op.customsChannel === "VERDE"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                              : op.customsChannel === "NARANJA"
                              ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                              : "bg-red-100 text-red-800 border-red-300 font-bold animate-pulse"
                          }
                        >
                          CANAL {op.customsChannel}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 text-xs font-normal">
                          Por determinar
                        </Badge>
                      )}
                    </div>

                    {/* Finances / Extra Charges */}
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Venta Total:</span>
                      <div className="text-right">
                        {totalUsd > 0 && (
                          <div className="font-bold text-slate-900">
                            {formatCurrency(totalUsd, "USD")}
                          </div>
                        )}
                        {totalPen > 0 && (
                          <div className="font-semibold text-slate-700 text-xs">
                            {formatCurrency(totalPen, "PEN")}
                          </div>
                        )}
                        {hasExtraCharge && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-0.5">
                            <TriangleAlert className="h-3 w-3 text-amber-500" /> + Sobrecostos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t flex justify-end">
                    <OperationActionsMenu operation={op} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 text-left">
                      ID Operación / Cotización
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">
                      Cliente / Razón Social
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-left">
                      Salida / Llegada (ETD / ETA)
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">
                      Canal Aduana
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">
                      Finanzas / Venta
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">
                      Estado
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations.map((op) => {
                    const opDisplayCode = op.id.startsWith("OP-")
                      ? op.id
                      : `OP-${op.quotation.code.replace(/^COT-/, "")}`;

                    let totalUsd = 0;
                    let totalPen = 0;
                    let hasExtraCharge = false;

                    op.charges.forEach((c) => {
                      if (c.isExtraCharge) hasExtraCharge = true;
                      if (c.currency === "PEN") {
                        totalPen += c.totalPrice;
                      } else {
                        totalUsd += c.totalPrice;
                      }
                    });

                    return (
                      <TableRow
                        key={op.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* ID Column */}
                        <TableCell className="text-left align-middle">
                          <Link
                            href={`/operations/${op.id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline block text-sm"
                          >
                            {opDisplayCode}
                          </Link>
                          <span className="text-xs text-slate-400 font-mono block">
                            {op.quotation.code}
                          </span>
                        </TableCell>

                        {/* Client Column */}
                        <TableCell className="text-left align-middle">
                          <div className="font-medium text-slate-900 text-sm">
                            {op.quotation.client.businessName}
                          </div>
                          {op.blNumber && (
                            <div className="text-xs text-slate-500 font-mono">
                              BL: {op.blNumber}
                            </div>
                          )}
                        </TableCell>

                        {/* Dates ETD / ETA Column */}
                        <TableCell className="text-left align-middle text-xs space-y-0.5">
                          <div className="text-slate-700">
                            <span className="text-slate-400 font-medium">Salida: </span>
                            <span className="font-semibold">{formatDate(op.etd)}</span>
                          </div>
                          <div className="text-slate-700">
                            <span className="text-slate-400 font-medium">Llegada: </span>
                            <span className="font-semibold">{formatDate(op.eta)}</span>
                          </div>
                        </TableCell>

                        {/* Customs Channel Column */}
                        <TableCell className="text-center align-middle">
                          {op.customsChannel ? (
                            <Badge
                              className={
                                op.customsChannel === "VERDE"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold px-2.5 py-0.5"
                                  : op.customsChannel === "NARANJA"
                                  ? "bg-amber-100 text-amber-800 border-amber-300 font-bold px-2.5 py-0.5"
                                  : "bg-red-100 text-red-800 border-red-300 font-bold animate-pulse px-2.5 py-0.5"
                              }
                            >
                              CANAL {op.customsChannel}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-slate-400 text-xs font-normal border-dashed"
                            >
                              Por determinar
                            </Badge>
                          )}
                        </TableCell>

                        {/* Financial / Extra Charges Column */}
                        <TableCell className="text-right align-middle">
                          {totalUsd > 0 && (
                            <div className="font-bold text-slate-900 text-sm">
                              {formatCurrency(totalUsd, "USD")}
                            </div>
                          )}
                          {totalPen > 0 && (
                            <div className="font-semibold text-slate-600 text-xs">
                              {formatCurrency(totalPen, "PEN")}
                            </div>
                          )}
                          {totalUsd === 0 && totalPen === 0 && (
                            <div className="text-slate-400 text-xs italic">
                              Sin cargos
                            </div>
                          )}

                          {hasExtraCharge && (
                            <div className="flex items-center justify-end gap-1 text-[11px] text-amber-600 font-semibold mt-0.5">
                              <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
                              <span>+ Sobrecostos</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Status Column */}
                        <TableCell className="text-center align-middle">
                          <Badge
                            className={
                              op.status === "EN_TRANSITO"
                                ? "bg-blue-100 text-blue-800 border-blue-200 font-semibold"
                                : op.status === "EN_ADUANA"
                                ? "bg-amber-100 text-amber-800 border-amber-200 font-semibold"
                                : op.status === "RETIRADO"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold"
                                : "bg-slate-100 text-slate-700 border-slate-200 font-medium"
                            }
                          >
                            {statusLabelMap[op.status] || op.status}
                          </Badge>
                        </TableCell>

                        {/* Action Column */}
                        <TableCell className="text-center align-middle">
                          <OperationActionsMenu operation={op} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
