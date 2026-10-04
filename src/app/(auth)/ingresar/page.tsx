import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/tenant";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Ingresar" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-lg font-semibold">Ingresar</h1>
      <p className="mb-6 mt-1 text-sm text-ink-2">El acceso es solo por invitación de tu empresa.</p>
      <SignInForm next={next} />
    </>
  );
}
