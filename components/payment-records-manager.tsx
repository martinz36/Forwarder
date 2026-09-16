"use client";

import { useState, useTransition } from "react";
import { DollarSign, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { addPaymentRecordAction, deletePaymentRecordAction } from "@/app/operations/payment-actions";

export interface PaymentRecordItem {
  id: string;
  concept: string;
  amount: number;
  currency: string;
  bank?: string | null;
  operationNumber?: string | null;
  paymentDate: Date | string;
  createdAt?: Date | string;
}

interface PaymentRecordsManagerProps {
  operationId: string;
  paymentRecords: PaymentRecordItem[];
}

export function PaymentRecordsManager({
  operationId,
  paymentRecords,
}: PaymentRecordsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [bank, setBank] = useState("BCP");
  const [operationNumber, setOperationNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const totalPaymentsUsd = paymentRecords
    .filter((p) => p.currency === "USD")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaymentsPen = paymentRecords
    .filter((p) => p.currency === "PEN")
    .reduce((sum, p) => sum + p.amount, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const parsedAmount = parseFloat(amount);
    if (!concept.trim()) {
      setErrorMsg("Ingresa el concepto del pago.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Ingresa un monto válido mayor a 0.");
      return;
    }

    startTransition(async () => {
      try {
        await addPaymentRecordAction(operationId, {
          concept: concept.trim(),
          amount: parsedAmount,
          currency,
          bank,
          operationNumber: operationNumber.trim() || undefined,
          paymentDate,
        });

        // Reset form on success
        setConcept("");
        setAmount("");
        setOperationNumber("");
      } catch (err: any) {
        setErrorMsg(err?.message || "Error al registrar el pago.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este registro de pago?")) return;
    startTransition(async () => {
      await deletePaymentRecordAction(id, operationId);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Registro de Pagos y Anticipos Recibidos</h3>
            <p className="text-xs text-slate-500">
              Registra las transferencias o abonos de anticipos del cliente para su descuento en la Liquidación Final.
            </p>
          </div>
        </div>

        {/* Dynamic Summary Badges */}
        <div className="flex items-center gap-2">
          {totalPaymentsUsd > 0 && (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold px-3 py-1 text-xs">
              Anticipos Recibidos USD: {formatCurrency(totalPaymentsUsd, "USD")}
            </Badge>
          )}
          {totalPaymentsPen > 0 && (
            <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold px-3 py-1 text-xs">
              Anticipos Recibidos PEN: {formatCurrency(totalPaymentsPen, "PEN")}
            </Badge>
          )}
        </div>
      </div>

      {/* Payment Entry Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border bg-slate-50/70 p-4 shadow-sm space-y-4">
        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-emerald-600" /> Registrar Nuevo Pago / Depósito
        </h4>

        {errorMsg && (
          <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Concepto del Pago *</Label>
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Anticipo VUCE DIGESA / Abono 50%"
              className="bg-white text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Banco *</Label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            >
              <option value="BCP">BCP</option>
              <option value="Interbank">Interbank</option>
              <option value="BBVA">BBVA Continental</option>
              <option value="Scotiabank">Scotiabank</option>
              <option value="BanBif">BanBif</option>
              <option value="Efectivo / Caja">Efectivo / Caja</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">N° Operación / Ref.</Label>
            <Input
              value={operationNumber}
              onChange={(e) => setOperationNumber(e.target.value)}
              placeholder="Ej. Op. 094852"
              className="bg-white text-xs h-9 font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Moneda & Monto *</Label>
            <div className="flex gap-1.5">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-20 h-9 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
              </select>

              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-white text-xs h-9 font-mono text-right font-semibold"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Fecha de Pago *</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="bg-white text-xs h-9"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-4 shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Registrar Pago
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Payment Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 border-b text-slate-700 font-semibold">
            <tr>
              <th className="p-3 text-left">Fecha Pago</th>
              <th className="p-3 text-left">Concepto</th>
              <th className="p-3 text-center">Banco</th>
              <th className="p-3 text-center">N° Operación</th>
              <th className="p-3 text-center">Moneda</th>
              <th className="p-3 text-right">Monto Recibido</th>
              <th className="p-3 text-center w-16">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paymentRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                  No hay pagos ni anticipos registrados para esta operación aún.
                </td>
              </tr>
            ) : (
              paymentRecords.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {new Date(pay.paymentDate).toLocaleDateString("es-PE")}
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{pay.concept}</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px]">
                      {pay.bank || "N/A"}
                    </Badge>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-600">
                    {pay.operationNumber || "-"}
                  </td>
                  <td className="p-3 text-center font-bold">{pay.currency}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(pay.amount, pay.currency as any)}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleDelete(pay.id)}
                      className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar Registro"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
