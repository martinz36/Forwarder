import { notFound } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { renderStatementPdf } from "@/server/statement-pdf";

/** PDF de aviso de llegada, liquidaciones y recibos: /documentos/AL-2026-0001 */
export async function GET(_: Request, { params }: { params: Promise<{ number: string }> }) {
  const number = decodeURIComponent((await params).number);
  const { organization } = await requireTenant();
  const pdf = await renderStatementPdf(getDb(), organization.id, number);
  if (!pdf) notFound();
  return new Response(new Uint8Array(pdf.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
