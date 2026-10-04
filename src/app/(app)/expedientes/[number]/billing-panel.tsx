"use client";

import { useActionState, useState } from "react";
import type { StatementType } from "@/generated/prisma/enums";
import { addPaymentAction, deletePaymentAction, issueStatementAction, voidStatementAction } from "../billing-actions";
import { FormError } from "@/components/form";
import { formatMoney } from "@/lib/format";

export interface BalanceView {
  currency: string;
  charged: string;
  paid: string;
  balance: string;
}

export interface PaymentView {
  id: string;
  paidAt: string; // formateada
  amount: string;
  currency: string;
  detail: string;
  kind: string;
}

export interface StatementView {
  id: string;
  number: string;
  type: StatementType;
  issuedAt: string;
  status: "ISSUED" | "VOID";
  total: string;
}

const TYPES: { type: StatementType; label: string; hint: string }[] = [
  { type: "ARRIVAL_NOTICE", label: "Aviso de llegada", hint: "Gastos de la agencia de carga, para que el cliente deposite antes del arribo." },
  { type: "CUSTOMS_SETTLEMENT", label: "Liquidación de aduanas", hint: "Comisión, gastos operativos, almacén, transporte y costos por canal." },
  { type: "FINAL_SETTLEMENT", label: "Liquidación final", hint: "Todo lo cobrado contra los depósitos, con el saldo." },
  { type: "REIMBURSEMENT_RECEIPT", label: "Recibo de reembolso", hint: "Solo los gastos no afectos (reembolsos). Lo afecto va en la factura." },
];
const LABEL = Object.fromEntries(TYPES.map((t) => [t.type, t.label])) as Record<StatementType, string>;
const INPUT = "mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm text-ink focus:border-navy focus:outline-none";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

function IssueButtons({ shipmentId, number }: { shipmentId: string; number: string }) {
  const [state, issue, pending] = useActionState(issueStatementAction, undefined);
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {TYPES.map((t) => (
          <form key={t.type} action={issue} className="rounded-sm border border-rule bg-surface p-3">
            <input type="hidden" name="shipmentId" value={shipmentId} />
            <input type="hidden" name="number" value={number} />
            <input type="hidden" name="type" value={t.type} />
            <input type="hidden" name="notes" value={notes} />
            <button disabled={pending} className="press text-left text-sm font-medium text-navy hover:underline disabled:opacity-60">
              Emitir {t.label.toLowerCase()}
            </button>
            <p className="mt-0.5 text-xs text-ink-3">{t.hint}</p>
          </form>
        ))}
      </div>
      <label className="block text-xs text-ink-3">
        Observación para el próximo documento (opcional)
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej.: incremento de flete por trasbordo de la nave" className={INPUT} />
      </label>
      {state?.ok && <p className="text-sm text-ok">{state.ok}. Descárgalo abajo y envíalo al cliente.</p>}
      <FormError message={state?.error} />
    </div>
  );
}

function StatementRow({ s, number, editable }: { s: StatementView; number: string; editable: boolean }) {
  const [state, voidIt, pending] = useActionState(voidStatementAction, undefined);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
      <a href={`/documentos/${encodeURIComponent(s.number)}`} target="_blank" rel="noreferrer" className={`font-mono font-medium ${s.status === "VOID" ? "text-ink-3 line-through" : "text-navy underline decoration-rule underline-offset-4"}`}>
        {s.number}
      </a>
      <span className="text-ink-2">{LABEL[s.type]}</span>
      <span className="text-xs text-ink-3">{s.issuedAt}</span>
      <span className="tnum ml-auto text-ink">{s.total}</span>
      {s.status === "VOID" ? (
        <span className="text-xs text-ink-3">Anulado</span>
      ) : (
        editable && (
          <form action={voidIt}>
            <input type="hidden" name="statementId" value={s.id} />
            <input type="hidden" name="number" value={number} />
            <button
              disabled={pending}
              onClick={(e) => {
                if (!confirm(`¿Anular ${s.number}?`)) e.preventDefault();
              }}
              className="press rounded-sm px-2 py-1 text-xs text-ink-3 hover:bg-ink/5"
            >
              Anular
            </button>
          </form>
        )
      )}
      <FormError message={state?.error} />
    </li>
  );
}

function PaymentForm({ shipmentId, number }: { shipmentId: string; number: string }) {
  const [state, add, pending] = useActionState(addPaymentAction, undefined);
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <div className="border-t border-rule px-4 py-3">
        <button type="button" onClick={() => setOpen(true)} className="press text-sm font-medium text-navy hover:underline">
          + Registrar depósito del cliente
        </button>
        {state?.ok && <span className="ml-2 text-xs text-ok">{state.ok}</span>}
      </div>
    );
  return (
    <form
      action={(fd) => {
        add(fd);
        setOpen(false);
      }}
      className="grid grid-cols-2 items-end gap-2 border-t border-rule bg-paper/40 px-4 py-3 sm:grid-cols-[7rem_5rem_8.5rem_1fr_1fr]"
    >
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="number" value={number} />
      <label className="text-xs text-ink-3">
        Monto
        <input name="amount" type="number" step="0.01" min="0.01" required className={`${INPUT} tnum text-right`} />
      </label>
      <label className="text-xs text-ink-3">
        Moneda
        <select name="currency" className={INPUT}>
          <option value="USD">USD</option>
          <option value="PEN">S/</option>
        </select>
      </label>
      <label className="text-xs text-ink-3">
        Fecha
        <input name="paidAt" type="date" defaultValue={today()} className={INPUT} />
      </label>
      <label className="text-xs text-ink-3">
        Banco
        <input name="bank" placeholder="BCP, BBVA…" className={INPUT} />
      </label>
      <label className="text-xs text-ink-3">
        N° de operación
        <input name="reference" className={INPUT} />
      </label>
      <input type="hidden" name="kind" value="ADVANCE" />
      <span className="col-span-2 flex gap-2 sm:col-span-5">
        <button disabled={pending} className="press rounded-sm bg-signal px-3 py-1.5 text-sm font-medium text-white">
          Registrar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="press px-2 py-1.5 text-sm text-ink-3">
          Cancelar
        </button>
      </span>
      <FormError message={state?.error} />
    </form>
  );
}

function PaymentRow({ p, number, editable }: { p: PaymentView; number: string; editable: boolean }) {
  const [, remove, pending] = useActionState(deletePaymentAction, undefined);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
      <span className="w-24 text-ink-3">{p.paidAt}</span>
      <span className="min-w-0 flex-1 truncate text-ink-2">{p.detail}</span>
      <span className="tnum font-medium text-ink">{formatMoney(p.amount, p.currency)}</span>
      {editable && (
        <form action={remove}>
          <input type="hidden" name="paymentId" value={p.id} />
          <input type="hidden" name="number" value={number} />
          <button
            disabled={pending}
            onClick={(e) => {
              if (!confirm("¿Eliminar este depósito?")) e.preventDefault();
            }}
            className="press rounded-sm px-2 py-1 text-xs text-ink-3 hover:bg-ink/5"
          >
            Eliminar
          </button>
        </form>
      )}
    </li>
  );
}

export function BillingPanel({
  shipmentId,
  number,
  balance,
  payments,
  statements,
  editable,
  hasCharges,
}: {
  shipmentId: string;
  number: string;
  balance: BalanceView[];
  payments: PaymentView[];
  statements: StatementView[];
  editable: boolean;
  hasCharges: boolean;
}) {
  return (
    <div className="space-y-5">
      {balance.length > 0 && (
        <dl className="grid gap-3 sm:grid-cols-2">
          {balance.map((b) => {
            const amount = Number(b.balance);
            return (
              <div key={b.currency} className="rounded-md border border-rule bg-surface">
                <div className="flex justify-between px-4 py-2 text-sm">
                  <dt className="text-ink-2">Total a cobrar</dt>
                  <dd className="tnum text-ink">{formatMoney(b.charged, b.currency)}</dd>
                </div>
                <div className="flex justify-between border-t border-rule px-4 py-2 text-sm">
                  <dt className="text-ink-2">Depósitos</dt>
                  <dd className="tnum text-ink">{formatMoney(b.paid, b.currency)}</dd>
                </div>
                <div className={`flex justify-between px-4 py-2.5 ${amount > 0 ? "bg-warn/10 text-warn" : amount < 0 ? "bg-info/10 text-info" : "bg-ok/10 text-ok"}`}>
                  <dt className="font-medium">{amount > 0 ? "Saldo por cobrar" : amount < 0 ? "Saldo a favor del cliente" : "Sin saldo"}</dt>
                  <dd className="tnum font-mono font-medium">{formatMoney(Math.abs(amount).toFixed(2), b.currency)}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      )}

      <div className="overflow-hidden rounded-md border border-rule bg-surface">
        <h3 className="border-b border-rule bg-paper/60 px-4 py-2 text-xs font-medium text-ink-3">Depósitos del cliente</h3>
        {payments.length === 0 ? (
          <p className="px-4 py-3 text-sm text-ink-3">Sin depósitos registrados.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {payments.map((p) => (
              <PaymentRow key={p.id} p={p} number={number} editable={editable} />
            ))}
          </ul>
        )}
        {editable && <PaymentForm shipmentId={shipmentId} number={number} />}
      </div>

      <div className="overflow-hidden rounded-md border border-rule bg-surface">
        <h3 className="border-b border-rule bg-paper/60 px-4 py-2 text-xs font-medium text-ink-3">Documentos emitidos</h3>
        {statements.length === 0 ? (
          <p className="px-4 py-3 text-sm text-ink-3">Aún no se emitió aviso de llegada ni liquidaciones.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {statements.map((s) => (
              <StatementRow key={s.id} s={s} number={number} editable={editable} />
            ))}
          </ul>
        )}
      </div>

      {editable && hasCharges && <IssueButtons shipmentId={shipmentId} number={number} />}
    </div>
  );
}
