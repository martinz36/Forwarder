"use client";

import { useState } from "react";
import { Link2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyMasterPortalButtonProps {
  portalToken: string;
  clientName: string;
}

export function CopyMasterPortalButton({ portalToken, clientName }: CopyMasterPortalButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!portalToken) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const portalUrl = `${origin}/portal/${portalToken}`;

    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleOpenPreview() {
    if (!portalToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    window.open(`${origin}/portal/${portalToken}`, "_blank");
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Button
        type="button"
        variant={copied ? "default" : "outline"}
        onClick={handleCopy}
        className={
          copied
            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-3 flex items-center gap-1.5 shadow-sm transition-all shrink-0 border-emerald-600"
            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs h-9 px-3 flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        }
        title="Copiar enlace del Portal Maestro para enviar al cliente"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-white shrink-0" />
            <span>¡Enlace Copiado!</span>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 text-slate-500 shrink-0" />
            <span>Copiar Portal Maestro</span>
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleOpenPreview}
        className="h-9 w-9 p-0 shrink-0 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors"
        title="Ver Portal Maestro como Cliente"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}
