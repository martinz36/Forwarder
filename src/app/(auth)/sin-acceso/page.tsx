import { signOutAction } from "../actions";

export default function NoAccessPage() {
  return (
    <>
      <h1 className="text-lg font-semibold">Sin empresa asignada</h1>
      <p className="mt-2 text-sm text-ink-2">Tu cuenta no pertenece a ninguna empresa. Pide una invitación al administrador.</p>
      <form action={signOutAction} className="mt-6">
        <button className="text-sm font-medium text-navy underline underline-offset-4">Salir</button>
      </form>
    </>
  );
}
