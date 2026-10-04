"use client";

import { useActionState, useState } from "react";
import { setMilestoneAction } from "../actions";
import { FormError } from "@/components/form";

export interface MilestoneView {
  id: string;
  name: string;
  clientLabel: string;
  clientVisible: boolean;
  notifyClient: boolean;
  status: "PENDING" | "DONE" | "SKIPPED";
  completedAt: string | null; // ya formateada
  note: string | null;
  phase: "QUOTING" | "OPERATION";
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

function MilestoneRow({ m, number, isNext, editable }: { m: MilestoneView; number: string; isNext: boolean; editable: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setMilestoneAction, undefined);
  const done = m.status === "DONE";
  const skipped = m.status === "SKIPPED";

  return (
    <li className="relative pb-4 pl-6 last:pb-0">
      <span
        aria-hidden
        className={`absolute -left-[6.5px] top-1 h-3 w-3 rounded-full border-2 ${
          done ? "border-ok bg-ok" : skipped ? "border-rule bg-rule" : isNext ? "border-signal bg-surface" : "border-rule bg-paper"
        }`}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <span className={`text-base ${done ? "text-ink" : skipped ? "text-ink-3 line-through" : isNext ? "font-medium text-ink" : "text-ink-2"}`}>
            {m.name}
          </span>
          {isNext && !open && <span className="ml-2 text-xs font-medium text-signal">Siguiente</span>}
          <div className="text-xs text-ink-3">
            {m.clientVisible ? `Cliente ve: “${m.clientLabel}”` : "Solo interno"}
            {m.notifyClient && m.clientVisible ? " · avisa al cliente" : ""}
            {m.completedAt && ` · ${m.completedAt}`}
            {skipped && " · no aplica"}
            {m.note && ` · ${m.note}`}
          </div>
        </div>
        {editable && !open && (
          <div className="flex gap-1">
            {m.status === "PENDING" ? (
              <button type="button" onClick={() => setOpen(true)} className="press rounded-sm px-2 py-1 text-sm font-medium text-navy hover:bg-navy/5">
                Marcar
              </button>
            ) : (
              <form action={action}>
                <input type="hidden" name="milestoneId" value={m.id} />
                <input type="hidden" name="number" value={number} />
                <input type="hidden" name="status" value="PENDING" />
                <button disabled={pending} className="press rounded-sm px-2 py-1 text-sm text-ink-3 hover:bg-ink/5 hover:text-ink">
                  Deshacer
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {open && (
        <form
          action={(fd) => {
            action(fd);
            setOpen(false);
          }}
          className="mt-2 space-y-2 rounded-sm border border-rule bg-paper/50 p-3"
        >
          <input type="hidden" name="milestoneId" value={m.id} />
          <input type="hidden" name="number" value={number} />
          <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <label className="block text-xs text-ink-3">
              Fecha
              <input
                type="date"
                name="completedAt"
                defaultValue={today()}
                className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-ink"
              />
            </label>
            <label className="block text-xs text-ink-3">
              Nota (opcional{m.clientVisible ? ", la ve el cliente" : ""})
              <input name="note" className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-ink" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button name="status" value="DONE" disabled={pending} className="press rounded-sm bg-ok px-3 py-1.5 text-sm font-medium text-white">
              {pending ? "Guardando…" : "Cumplido"}
            </button>
            <button name="status" value="SKIPPED" disabled={pending} className="press rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm text-ink-2">
              No aplica
            </button>
            <button type="button" onClick={() => setOpen(false)} className="press px-2 py-1.5 text-sm text-ink-3">
              Cancelar
            </button>
          </div>
        </form>
      )}
      <FormError message={state?.error} />
    </li>
  );
}

export function Milestones({ items, number, editable }: { items: MilestoneView[]; number: string; editable: boolean }) {
  const nextId = items.find((m) => m.status === "PENDING")?.id;
  const groups = [
    { phase: "QUOTING" as const, title: "Etapa comercial" },
    { phase: "OPERATION" as const, title: "Operación" },
  ].map((g) => ({ ...g, items: items.filter((m) => m.phase === g.phase) }));

  return (
    <div className="space-y-5">
      {groups
        .filter((g) => g.items.length)
        .map((g) => (
          <div key={g.phase}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{g.title}</h3>
            <ol className="relative ml-1.5 border-l border-rule">
              {g.items.map((m) => (
                <MilestoneRow key={m.id} m={m} number={number} isNext={m.id === nextId} editable={editable} />
              ))}
            </ol>
          </div>
        ))}
    </div>
  );
}
