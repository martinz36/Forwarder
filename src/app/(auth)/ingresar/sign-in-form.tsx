"use client";

import { useActionState } from "react";
import { signInAction } from "../actions";
import { ActionForm, Field, FormError, SubmitButton } from "@/components/form";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, undefined);
  return (
    <ActionForm action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      <FormError message={state?.error} />
      <SubmitButton pending={pending} pendingLabel="Ingresando…">Ingresar</SubmitButton>
    </ActionForm>
  );
}
