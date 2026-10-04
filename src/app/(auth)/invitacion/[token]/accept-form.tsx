"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "../../actions";
import { ActionForm, Field, FormError, SubmitButton } from "@/components/form";

export function AcceptForm({ token, email }: { token: string; email?: string | null }) {
  const [state, action, pending] = useActionState(acceptInvitationAction.bind(null, token), undefined);
  return (
    <ActionForm action={action} className="space-y-4">
      <Field label="Tu nombre" name="name" autoComplete="name" required />
      <Field label="Correo" name="email" type="email" autoComplete="email" defaultValue={email} required />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres." required />
      <Field label="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" required />
      <FormError message={state?.error} />
      <SubmitButton pending={pending} pendingLabel="Creando tu cuenta…">Crear cuenta y entrar</SubmitButton>
    </ActionForm>
  );
}
