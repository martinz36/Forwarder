"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "../../actions";
import { Field, FormError, SubmitButton } from "@/components/form";

export function AcceptForm({ token, email }: { token: string; email?: string | null }) {
  const [state, action] = useActionState(acceptInvitationAction.bind(null, token), undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Tu nombre" name="name" autoComplete="name" />
      <Field label="Correo" name="email" type="email" autoComplete="email" defaultValue={email ?? undefined} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres." />
      <Field label="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" />
      <FormError message={state?.error} />
      <SubmitButton pendingLabel="Creando tu cuenta…">Crear cuenta y entrar</SubmitButton>
    </form>
  );
}
