"use client";

import { useActionState } from "react";
import { reopenExpedienteAction } from "../actions";
import { FormError, SubmitButton } from "@/components/form";

export function ReopenButton({ shipmentId, number }: { shipmentId: string; number: string }) {
  const [state, action] = useActionState(reopenExpedienteAction, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="number" value={number} />
      <SubmitButton pendingLabel="Reabriendo…" full={false} variant="secondary">
        Reabrir expediente
      </SubmitButton>
      <FormError message={state?.error} />
    </form>
  );
}
