"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyCodeButtonProps {
  text: string;
  title?: string;
  className?: string;
}

export function CopyCodeButton({
  text,
  title = "Copiar código de referencia",
  className = "",
}: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!text) return;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "¡Copiado!" : title}
      className={`inline-flex items-center justify-center p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all shadow-2xs group ${className}`}
    >
      {copied ? (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 px-0.5">
          <Check className="h-3 w-3 text-emerald-600" />
          <span>Copiado</span>
        </span>
      ) : (
        <Copy className="h-3 w-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
      )}
    </button>
  );
}
