import { notFound } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { renderQuotePdf } from "@/server/quote-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const number = decodeURIComponent((await params).number);
  const { organization } = await requireTenant();
  const versionNo = Number(new URL(request.url).searchParams.get("v")) || undefined;

  const pdf = await renderQuotePdf(getDb(), organization.id, number, versionNo);
  if (!pdf) notFound();

  return new Response(new Uint8Array(pdf.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
