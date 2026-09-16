"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import {
  MoreHorizontal,
  Eye,
  Share2,
  Receipt,
  Check,
  ExternalLink,
  Loader2,
  FileText,
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
import { ArrivalNoticePDF, ArrivalNoticePdfData } from "@/components/pdf/arrival-notice-pdf";

interface OperationActionsMenuProps {
  operation: {
    id: string;
    status: string;
    blNumber?: string | null;
    etd?: Date | string | null;
    eta?: Date | string | null;
    customsChannel?: "VERDE" | "NARANJA" | "ROJO" | null;
    sharedToken: string;
    createdAt?: Date | string;
    quotation?: {
      id?: string;
      code?: string;
      origin?: string | null;
      destination?: string | null;
      shippingLine?: string | null;
      client?: {
        id?: string;
        businessName?: string;
        documentType?: string | null;
        documentNumber?: string | null;
        address?: string | null;
      };
    };
    charges?: Array<{
      id?: string;
      currency?: string;
      totalPrice?: number;
      unitPrice?: number | null;
      quantity?: number | null;
      description?: string | null;
      category?: string | null;
      isTaxable?: boolean | null;
      isExtraCharge?: boolean;
    }>;
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
  const [isGeneratingArrivalNotice, setIsGeneratingArrivalNotice] = useState(false);

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

  const handleDownloadArrivalNotice = async () => {
    try {
      setIsGeneratingArrivalNotice(true);

      let taxableUsd = 0;
      let nonTaxableUsd = 0;
      let taxablePen = 0;
      let nonTaxablePen = 0;

      (operation.charges || []).forEach((charge) => {
        const sale = charge.totalPrice || 0;
        if (charge.currency === "PEN") {
          if (charge.isTaxable) taxablePen += sale;
          else nonTaxablePen += sale;
        } else {
          if (charge.isTaxable) taxableUsd += sale;
          else nonTaxableUsd += sale;
        }
      });

      taxableUsd = Number(taxableUsd.toFixed(2));
      const igvUsd = Number((taxableUsd * 0.18).toFixed(2));
      const totalTaxableUsd = Number((taxableUsd + igvUsd).toFixed(2));
      nonTaxableUsd = Number(nonTaxableUsd.toFixed(2));
      const grandTotalUsd = Number((totalTaxableUsd + nonTaxableUsd).toFixed(2));

      taxablePen = Number(taxablePen.toFixed(2));
      const igvPen = Number((taxablePen * 0.18).toFixed(2));
      const totalTaxablePen = Number((taxablePen + igvPen).toFixed(2));
      nonTaxablePen = Number(nonTaxablePen.toFixed(2));
      const grandTotalPen = Number((totalTaxablePen + nonTaxablePen).toFixed(2));

      const opDisplayCode = operation.id.startsWith("OP-")
        ? operation.id
        : `OP-${operation.quotation?.code?.replace(/^COT-/, "") || ""}`;

      const arrivalNoticePdfData: ArrivalNoticePdfData = {
        operationCode: opDisplayCode,
        blNumber: operation.blNumber,
        etd: operation.etd,
        eta: operation.eta,
        origin: operation.quotation?.origin,
        destination: operation.quotation?.destination,
        shippingLine: operation.quotation?.shippingLine,
        customsChannel: operation.customsChannel,
        createdAt: operation.createdAt ? new Date(operation.createdAt) : new Date(),
        client: {
          name: operation.quotation?.client?.businessName || "",
          documentType: operation.quotation?.client?.documentType,
          documentNumber: operation.quotation?.client?.documentNumber,
          address: operation.quotation?.client?.address,
        },
        charges: (operation.charges || []).map((c) => ({
          description: c.description || "Servicio",
          category: c.category || "",
          currency: c.currency || "USD",
          unitPrice: c.unitPrice ?? c.totalPrice ?? 0,
          quantity: c.quantity ?? 1,
          totalPrice: c.totalPrice || 0,
          isTaxable: c.isTaxable ?? false,
          isExtraCharge: c.isExtraCharge ?? false,
        })),
        subtotalTaxableUsd: taxableUsd,
        igvUsd,
        totalTaxableUsd,
        totalNonTaxableUsd: nonTaxableUsd,
        grandTotalUsd,
        subtotalTaxablePen: taxablePen,
        igvPen,
        totalTaxablePen,
        totalNonTaxablePen: nonTaxablePen,
        grandTotalPen,
      };

      const blob = await pdf(<ArrivalNoticePDF data={arrivalNoticePdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Aviso_Llegada_${opDisplayCode.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
      a.click();
    } catch (err: any) {
      console.error("Error al generar el Aviso de Llegada:", err);
      alert("Error al generar el Aviso de Llegada en PDF.");
    } finally {
      setIsGeneratingArrivalNotice(false);
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
        <DropdownMenuContent align="end" className="w-56">
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

          {/* Generar Aviso de Llegada */}
          <DropdownMenuItem
            onClick={handleDownloadArrivalNotice}
            disabled={isGeneratingArrivalNotice}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            {isGeneratingArrivalNotice ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                <span>Generando Aviso...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-amber-600" />
                <span>Generar Aviso de Llegada</span>
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
