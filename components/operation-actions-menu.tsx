"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Share2,
  Receipt,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { generateLiquidationAction } from "@/app/liquidations/actions";

interface OperationActionsMenuProps {
  operation: {
    id: string;
    status: string;
    sharedToken: string;
    liquidation?: {
      id: string;
      status: string;
    } | null;
  };
}

export function OperationActionsMenu({ operation }: OperationActionsMenuProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const sharedLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/shared/${operation.sharedToken}`
      : `/shared/${operation.sharedToken}`;

  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateLiquidation = async () => {
    try {
      setIsGenerating(true);
      await generateLiquidationAction(operation.id);
    } catch (err: any) {
      alert(err?.message || "Error al generar la liquidación");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Quick View Button */}
      <Link href={`/operations/${operation.id}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
          title="Ver / Gestionar Operación"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver Operación</span>
        </Button>
      </Link>

      {/* Action Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* Ver / Gestionar Operación */}
          <DropdownMenuItem asChild>
            <Link
              href={`/operations/${operation.id}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4 text-blue-600" />
              <span>Ver / Gestionar</span>
            </Link>
          </DropdownMenuItem>

          {/* Portal del Cliente */}
          <DropdownMenuItem
            onClick={handleCopyPortalLink}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-purple-600" />
                <span>Portal del Cliente</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Liquidación Action */}
          {operation.liquidation ? (
            <DropdownMenuItem asChild>
              <Link
                href={`/liquidations/${operation.liquidation.id}`}
                className="flex items-center gap-2 cursor-pointer text-slate-700"
              >
                <ExternalLink className="h-4 w-4 text-emerald-600" />
                <span>Ver Liquidación</span>
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleGenerateLiquidation}
              disabled={isGenerating}
              className="flex items-center gap-2 cursor-pointer text-slate-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 text-amber-600" />
                  <span>Generar Liquidación</span>
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
