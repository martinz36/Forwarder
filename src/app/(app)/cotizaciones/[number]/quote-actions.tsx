"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { newVersionAction, respondQuoteAction, sendVersionAction } from "../actions";
import { FormError, SubmitButton } from "@/components/form";
import { buttonClass } from "@/components/button";

type VersionStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "SUPERSEDED" | "EXPIRED";

export function QuoteActions({
  quoteId,
  number,
  versionId,
  versionNo,
  status,
  editable,
  shipmentNumber,
}: {
  quoteId: string;
  number: string;
  versionId: string;
  versionNo: number;
  status: VersionStatus;
  editable: boolean;
  shipmentNumber: string | null;
}) {
  const [sendState, send] = useActionState(sendVersionAction, undefined);
  const [newState, newVersion] = useActionState(newVersionAction, undefined);
  const [respondState, respond] = useActionState(respondQuoteAction, undefined);
  const [answering, setAnswering] = useState(false);
  const pdf = `/cotizaciones/${encodeURIComponent(number)}/pdf?v=${versionNo}`;
  const message = sendState ?? newState ?? respondState;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <a href={pdf} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
          {status === "DRAFT" ? "Ver PDF (borrador)" : "Descargar PDF"}
        </a>

        {editable && status === "DRAFT" && (
          <>
            <Link href={`/cotizaciones/${number}/editar`} className={buttonClass("secondary")}>
              Editar
            </Link>
            <form action={send}>
              <input type="hidden" name="versionId" value={versionId} />
              <input type="hidden" name="number" value={number} />
              <SubmitButton pendingLabel="Marcando…" full={false}>
                Marcar como enviada
              </SubmitButton>
            </form>
          </>
        )}

        {editable && status === "SENT" && !answering && (
          <button type="button" onClick={() => setAnswering(true)} className={buttonClass("primary")}>
            Registrar respuesta del cliente
          </button>
        )}

        {editable && (status === "SENT" || status === "REJECTED") && (
          <form action={newVersion}>
            <input type="hidden" name="quoteId" value={quoteId} />
            <input type="hidden" name="number" value={number} />
            <SubmitButton pendingLabel="Creando…" full={false} variant="quiet">
              Nueva versión
            </SubmitButton>
          </form>
        )}

        {status === "ACCEPTED" && shipmentNumber && (
          <Link href={`/expedientes/${shipmentNumber}`} className={buttonClass("primary")}>
            Ir al expediente {shipmentNumber}
          </Link>
        )}
      </div>

      {answering && (
        <form action={respond} className="space-y-3 rounded-md border border-rule bg-surface p-4">
          <input type="hidden" name="quoteId" value={quoteId} />
          <input type="hidden" name="number" value={number} />
          <label className="block">
            <span className="text-sm font-medium text-ink">Comentario (opcional)</span>
            <input
              name="note"
              placeholder="Ej.: aceptó por correo el 05/10 · o motivo si no aceptó"
              className="mt-1.5 block w-full rounded-sm border border-rule bg-surface px-3 py-2 text-ink focus:border-navy focus:outline-none"
            />
          </label>
          <p className="text-xs text-ink-3">
            Si acepta, el expediente pasa a operación: se cargan los cargos de esta cotización, los hitos operativos y el checklist de documentos.
          </p>
          <div className="flex flex-wrap gap-2">
            <SubmitButton pendingLabel="Guardando…" full={false} name="decision" value="ACCEPTED">
              Aceptada
            </SubmitButton>
            <SubmitButton pendingLabel="Guardando…" full={false} variant="secondary" name="decision" value="REJECTED">
              No aceptada
            </SubmitButton>
            <button type="button" onClick={() => setAnswering(false)} className={buttonClass("quiet")}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {message?.ok && <p className="text-sm text-ok">{message.ok}</p>}
      <FormError message={message?.error} />
    </div>
  );
}
