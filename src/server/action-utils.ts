import "server-only";
import type { MemberRole } from "@/generated/prisma/enums";
import { requireTenant } from "@/server/tenant";
import { DomainError, type Actor } from "@/server/expedientes";

export type ActionState = { error?: string; ok?: string } | undefined;

const EDITORS: MemberRole[] = ["OWNER", "ADMIN", "OPERATIONS", "SALES"];

export function canEdit(role: MemberRole) {
  return EDITORS.includes(role);
}

/** Empresa y usuario de quien llama, exigiendo un rol que pueda modificar. */
export async function editorActor(): Promise<Actor> {
  const { organization, user, role } = await requireTenant();
  if (!canEdit(role)) throw new DomainError("Tu rol no permite hacer cambios.");
  return { organizationId: organization.id, userId: user.id };
}

/** Convierte errores de negocio en mensaje para el formulario; el resto se registra y se oculta. */
export function toActionError(err: unknown): ActionState {
  if (err instanceof DomainError) return { error: err.message };
  console.error(err);
  return { error: "No se pudo guardar. Intenta de nuevo." };
}

// Lectura de FormData
export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
export const num = (fd: FormData, key: string) => {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
export const int = (fd: FormData, key: string) => {
  const n = num(fd, key);
  return n === null ? null : Math.round(n);
};
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";
/** "2026-10-04" → mediodía en Lima, para que la fecha no cambie por zona horaria. */
export const date = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00-05:00`) : null;
};
export const oneOf = <T extends string>(fd: FormData, key: string, values: readonly T[], fallback: T): T => {
  const v = str(fd, key);
  return v && (values as readonly string[]).includes(v) ? (v as T) : fallback;
};
