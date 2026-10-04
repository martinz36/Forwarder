"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getDb } from "@/server/db";
import { hashToken } from "@/server/invitations";

export type FormState = { error?: string } | undefined;

const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
};

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y contraseña." };
  try {
    await getAuth().api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch {
    return { error: "Correo o contraseña incorrectos." };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction() {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/ingresar");
}

export async function acceptInvitationAction(token: string, _: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El correo no es válido." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const db = getDb();
  const invitation = await db.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
  const now = new Date();
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < now) {
    return { error: "Esta invitación ya se usó o venció. Pide una nueva." };
  }
  if (invitation.email && invitation.email !== email) {
    return { error: "Esta invitación es para otro correo." };
  }
  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Ya existe una cuenta con ese correo. Ingresa con ella." };
  }

  // Se reserva la invitación antes de crear la cuenta: si dos personas la usan a la vez, solo una entra.
  const claimed = await db.invitation.updateMany({
    where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
    data: { acceptedAt: now },
  });
  if (claimed.count === 0) return { error: "Esta invitación ya se usó o venció. Pide una nueva." };

  try {
    const ctx = await getAuth().$context;
    const user = await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: "invitation" });
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await ctx.password.hash(password),
    });
    await db.membership.create({ data: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role } });
    await db.activityEvent.create({
      data: {
        organizationId: invitation.organizationId,
        type: "member.joined",
        title: `${name} se unió al equipo`,
        actorUserId: user.id,
      },
    });
  } catch (err) {
    await db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: null } });
    console.error("acceptInvitation", err);
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  await getAuth().api.signInEmail({ body: { email, password }, headers: await headers() });
  redirect("/");
}
