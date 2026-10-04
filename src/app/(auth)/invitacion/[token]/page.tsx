import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/server/db";
import { hashToken } from "@/server/invitations";
import { ROLE } from "@/lib/labels";
import { AcceptForm } from "./accept-form";

export const metadata: Metadata = { title: "Invitación" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getDb().invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <>
        <h1 className="text-lg font-semibold">Invitación no disponible</h1>
        <p className="mt-2 text-sm text-ink-2">Este enlace ya se usó o venció. Pide una invitación nueva a tu empresa.</p>
        <Link href="/ingresar" className="mt-6 inline-block text-sm font-medium text-navy underline underline-offset-4">
          Ir a ingresar
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold">Únete a {invitation.organization.name}</h1>
      <p className="mb-6 mt-1 text-sm text-ink-2">
        Te invitaron con el rol <strong className="font-medium text-ink">{ROLE[invitation.role]}</strong>. Crea tu acceso.
      </p>
      <AcceptForm token={token} email={invitation.email} />
    </>
  );
}
