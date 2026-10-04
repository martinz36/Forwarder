"use client";

import { useActionState } from "react";
import { createQuoteAction } from "../actions";
import { FormError, SubmitButton } from "@/components/form";

export function NewQuoteForm({
  shipmentId,
  templates,
  suggestedId,
}: {
  shipmentId: string;
  templates: { value: string; label: string }[];
  suggestedId?: string;
}) {
  const [state, action] = useActionState(createQuoteAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 rounded-md border border-dashed border-rule bg-surface p-3 sm:flex-row sm:items-end">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <label className="block flex-1">
        <span className="text-sm font-medium text-ink">Nueva cotización desde plantilla</span>
        <select
          name="templateId"
          defaultValue={suggestedId ?? ""}
          className="mt-1.5 block w-full rounded-sm border border-rule bg-surface px-3 py-2 text-ink focus:border-navy focus:outline-none"
        >
          {templates.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
          <option value="">En blanco</option>
        </select>
      </label>
      <SubmitButton pendingLabel="Creando…" full={false}>
        Crear cotización
      </SubmitButton>
      <FormError message={state?.error} />
    </form>
  );
}
