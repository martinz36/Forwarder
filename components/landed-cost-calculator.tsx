"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Calculator,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  TrendingUp,
  RefreshCw,
  FileUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  saveAndCalculateLandedCostAction,
  deleteCommercialInvoiceAction,
  InvoiceItemInput,
} from "@/app/operations/landed-cost-actions";

export interface InvoiceItemResult {
  id?: string;
  sku?: string | null;
  description: string;
  quantity: number;
  unitFob: number;
  totalFob: number;
  allocatedExpenseUsd: number;
  finalUnitCostUsd: number;
  allocatedExpensePen: number;
  finalUnitCostPen: number;
}

export interface ExistingCommercialInvoice {
  id: string;
  invoiceNumber?: string | null;
  fobTotal: number;
  exchangeRate: number;
  items: InvoiceItemResult[];
}

interface LandedCostCalculatorProps {
  operationId: string;
  totalLogisticsChargesUsd: number;
  totalLogisticsChargesPen: number;
  existingInvoice?: ExistingCommercialInvoice | null;
}

export function LandedCostCalculator({
  operationId,
  totalLogisticsChargesUsd,
  totalLogisticsChargesPen,
  existingInvoice,
}: LandedCostCalculatorProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(
    existingInvoice?.invoiceNumber || ""
  );
  const [exchangeRate, setExchangeRate] = useState<number>(
    existingInvoice?.exchangeRate || 3.75
  );

  // Editable DataGrid items
  const [items, setItems] = useState<InvoiceItemInput[]>(
    existingInvoice?.items && existingInvoice.items.length > 0
      ? existingInvoice.items.map((i) => ({
          sku: i.sku || "",
          description: i.description,
          quantity: i.quantity,
          unitFob: i.unitFob,
        }))
      : [
          { sku: "SKU-001", description: "Producto Ejemplo A", quantity: 100, unitFob: 12.5 },
          { sku: "SKU-002", description: "Producto Ejemplo B", quantity: 50, unitFob: 25.0 },
        ]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Total Logistics Expense in USD using selected Exchange Rate
  const totalLogisticsExpenseUsd =
    totalLogisticsChargesUsd + (totalLogisticsChargesPen / (exchangeRate || 3.75));

  // Compute Total FOB from items
  const totalFobUsd = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitFob) || 0),
    0
  );

  // Compute estimated proration factor
  const estimatedFactor =
    totalFobUsd > 0 ? totalLogisticsExpenseUsd / totalFobUsd : 0;

  // Form handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        sku: `SKU-00${prev.length + 1}`,
        description: "",
        quantity: 1,
        unitFob: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof InvoiceItemInput,
    value: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Excel Import Handler
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length < 2) {
          alert("El archivo Excel no contiene suficientes filas.");
          return;
        }

        // Find header index or assume row 0
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(5, rawData.length); r++) {
          const rowStr = JSON.stringify(rawData[r]).toLowerCase();
          if (rowStr.includes("sku") || rowStr.includes("descripcion") || rowStr.includes("fob")) {
            headerRowIndex = r;
            break;
          }
        }

        const headers: string[] = rawData[headerRowIndex].map((h: any) =>
          String(h || "").toLowerCase().trim()
        );

        const skuIdx = headers.findIndex((h) => h.includes("sku") || h.includes("codigo"));
        const descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("prod") || h.includes("item"));
        const qtyIdx = headers.findIndex((h) => h.includes("cant") || h.includes("qty"));
        const fobIdx = headers.findIndex((h) => h.includes("fob") || h.includes("unit") || h.includes("precio"));

        const imported: InvoiceItemInput[] = [];

        for (let r = headerRowIndex + 1; r < rawData.length; r++) {
          const row = rawData[r];
          if (!row || row.length === 0) continue;

          const description = descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : `Producto Fila ${r}`;
          const sku = skuIdx !== -1 && row[skuIdx] ? String(row[skuIdx]).trim() : "";
          const quantity = qtyIdx !== -1 && row[qtyIdx] ? Math.max(1, parseInt(row[qtyIdx]) || 1) : 1;
          const unitFob = fobIdx !== -1 && row[fobIdx] ? Math.max(0, parseFloat(row[fobIdx]) || 0) : 0;

          if (description || unitFob > 0) {
            imported.push({ sku, description, quantity, unitFob });
          }
        }

        if (imported.length > 0) {
          setItems(imported);
          setSuccessMsg(`¡Éxito! Se importaron ${imported.length} productos desde el Excel.`);
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          alert("No se pudieron detectar productos válidos en el Excel. Revisa las columnas.");
        }
      } catch (err: any) {
        alert("Error al leer el archivo Excel: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // Run Proration Calculation Action
  const handleCalculate = async () => {
    if (items.length === 0) {
      setError("Agrega al menos un producto a la lista.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await saveAndCalculateLandedCostAction({
        operationId,
        invoiceNumber,
        exchangeRate: Number(exchangeRate) || 3.75,
        items,
      });
      setSuccessMsg("¡Costeo final calculado y guardado exitosamente!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || "Error al calcular el costeo de importación.");
    } finally {
      setLoading(false);
    }
  };

  // Export Landed Cost Results to Excel
  const handleExportExcel = () => {
    if (!existingInvoice || !existingInvoice.items || existingInvoice.items.length === 0) {
      alert("Debes primero calcular y guardar el costeo para poder exportar el reporte.");
      return;
    }

    const exportData = existingInvoice.items.map((i, idx) => ({
      "N°": idx + 1,
      "SKU": i.sku || "N/A",
      "Descripción": i.description,
      "Cantidad": i.quantity,
      "Valor FOB Unit. (USD)": i.unitFob,
      "Total FOB (USD)": i.totalFob,
      "Gastos Asignados (USD)": i.allocatedExpenseUsd,
      "Costo Final Unit. (USD)": i.finalUnitCostUsd,
      "Gastos Asignados (S/)": i.allocatedExpensePen,
      "Costo Final Unit. (S/)": i.finalUnitCostPen,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Costeo_Landed_Cost");

    const invNum = invoiceNumber ? invoiceNumber.replace(/[^a-zA-Z0-9-]/g, "_") : "Operacion";
    XLSX.writeFile(wb, `Costeo_Importacion_${invNum}.xlsx`);
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
      {/* Header Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Costeo de Importación (Landed Cost)</span>
            </h3>
            <Badge className="bg-blue-600 text-white font-semibold text-xs">
              PRORRATEO LOGÍSTICO
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prorratea fletes, aduana y gastos locales proporcionalmente entre los productos de la factura para calcular el costo unitario final en almacén.
          </p>
        </div>

        {existingInvoice && existingInvoice.items.length > 0 && (
          <Button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow gap-2 text-xs"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Costeo a Excel (.xlsx)</span>
          </Button>
        )}
      </div>

      {/* Inputs Header: Invoice Number, Exchange Rate & Total Logistics */}
      <div className="grid gap-4 sm:grid-cols-3 bg-slate-50 p-4 rounded-xl border">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Factura Comercial N°</Label>
          <Input
            placeholder="Ej: INV-2026-9874"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="bg-white text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">Tipo de Cambio PEN/USD (TC)</Label>
          <Input
            type="number"
            step="0.001"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.75)}
            className="bg-white text-sm font-semibold"
          />
        </div>

        <div className="space-y-1 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
            Gastos Logísticos A Prorratear
          </span>
          <div className="font-bold text-blue-900 text-sm">
            {formatCurrency(totalLogisticsExpenseUsd, "USD")} USD
          </div>
          <span className="text-[10px] text-blue-700 block">
            Factor Est.: <strong>{(estimatedFactor * 100).toFixed(2)}%</strong> sobre FOB
          </span>
        </div>
      </div>

      {/* Section: Interactive DataGrid (Table of Products) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-500" />
            <span>Ítems de la Factura Comercial ({items.length})</span>
          </h4>

          <div className="flex items-center gap-2">
            {/* Excel Upload Button */}
            <input
              type="file"
              id="excelFileInput"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelImport}
            />
            <label
              htmlFor="excelFileInput"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Subir Plantilla Excel</span>
            </label>

            <Button
              onClick={handleAddItem}
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar Producto</span>
            </Button>
          </div>
        </div>

        {/* DataGrid Table */}
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 text-center font-semibold text-slate-700">#</TableHead>
                  <TableHead className="w-32 font-semibold text-slate-700">SKU / Código</TableHead>
                  <TableHead className="font-semibold text-slate-700">Descripción del Producto *</TableHead>
                  <TableHead className="w-24 text-center font-semibold text-slate-700">Cantidad *</TableHead>
                  <TableHead className="w-32 text-right font-semibold text-slate-700">FOB Unit. ($) *</TableHead>
                  <TableHead className="w-32 text-right font-semibold text-slate-700">Total FOB ($)</TableHead>
                  <TableHead className="w-12 text-center font-semibold text-slate-700"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-400 italic">
                      No hay productos registrados. Usa el botón "Subir Plantilla Excel" o "Agregar Producto".
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => {
                    const rowTotalFob = (Number(item.quantity) || 0) * (Number(item.unitFob) || 0);

                    return (
                      <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="text-center font-bold text-xs text-slate-400">
                          {idx + 1}
                        </TableCell>

                        <TableCell>
                          <Input
                            placeholder="SKU-001"
                            value={item.sku || ""}
                            onChange={(e) => handleUpdateItem(idx, "sku", e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            placeholder="Descripción del producto..."
                            value={item.description}
                            onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, "quantity", parseInt(e.target.value) || 1)
                            }
                            className="h-8 text-xs text-center font-semibold"
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitFob}
                            onChange={(e) =>
                              handleUpdateItem(idx, "unitFob", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-xs text-right font-mono"
                          />
                        </TableCell>

                        <TableCell className="text-right font-bold text-slate-900 text-xs">
                          {formatCurrency(rowTotalFob, "USD")}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* DataGrid Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-600 space-x-4">
            <span>Total FOB Acumulado: <strong className="text-slate-900">{formatCurrency(totalFobUsd, "USD")}</strong></span>
            <span>•</span>
            <span>Factor Prorrateo: <strong className="text-blue-700">{(estimatedFactor * 100).toFixed(2)}%</strong></span>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={loading || items.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow gap-2 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculando Prorrateo...</span>
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                <span>Calcular Costeo Final (Landed Cost)</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* SECTION: RESULTS TABLE (CALCULATED LANDED COST) */}
      {existingInvoice && existingInvoice.items && existingInvoice.items.length > 0 && (
        <div className="pt-6 border-t space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Resultado del Costeo Final en Almacén (Landed Cost)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Resultado final del costo unitario puesto en almacén con gastos logísticos asignados.
              </p>
            </div>

            <Badge className="bg-emerald-600 text-white font-bold">
              PRORRATEO FINAL APLICADO
            </Badge>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-emerald-50/50">
                  <TableRow>
                    <TableHead className="w-12 text-center font-semibold text-emerald-900">#</TableHead>
                    <TableHead className="w-32 font-semibold text-emerald-900">SKU</TableHead>
                    <TableHead className="font-semibold text-emerald-900">Descripción Producto</TableHead>
                    <TableHead className="w-20 text-center font-semibold text-emerald-900">Cant.</TableHead>
                    <TableHead className="w-28 text-right font-semibold text-emerald-900">FOB Unit. ($)</TableHead>
                    <TableHead className="w-32 text-right font-semibold text-emerald-900">Gastos Asignados ($)</TableHead>
                    <TableHead className="w-36 text-right font-bold text-emerald-950">Costo Unit. Final ($)</TableHead>
                    <TableHead className="w-36 text-right font-bold text-emerald-950">Costo Unit. Final (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingInvoice.items.map((item, idx) => (
                    <TableRow key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-center font-bold text-xs text-slate-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 font-semibold">
                        {item.sku || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 text-xs">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-slate-600">
                        {formatCurrency(item.unitFob, "USD")}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono text-blue-700 font-semibold">
                        + {formatCurrency(item.allocatedExpenseUsd, "USD")}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-black text-emerald-700 bg-emerald-50/30">
                        {formatCurrency(item.finalUnitCostUsd, "USD")}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-black text-emerald-900 bg-emerald-50/50">
                        {formatCurrency(item.finalUnitCostPen, "PEN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
