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
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        onClick={handleCopy}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 flex items-center gap-1.5 shadow-sm transition-all"
        title="Copiar enlace del Portal Maestro para enviar al cliente"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-white" />
            <span>¡Enlace Copiado!</span>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            <span>Copiar Enlace Portal Maestro</span>
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleOpenPreview}
        className="h-9 w-9 p-0 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
        title="Ver Portal Maestro como Cliente"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}
