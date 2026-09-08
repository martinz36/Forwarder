"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import {
  MoreHorizontal,
  Eye,
  FileText,
  Download,
  Ship,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { QuotationPDF, QuotationPdfData } from "@/components/pdf/quotation-pdf";
import { createOperationFromQuotationAction } from "@/app/operations/actions";
import { deleteQuotationAction } from "@/app/quotations/actions";

interface QuotationItemData {
  description: string;
  category?: string | null;
  currency: string;
  unitPrice: number;
  quantity: number;
  total: number;
  isTaxable: boolean;
}

interface QuotationActionsMenuProps {
  quotation: {
    id: string;
    code: string;
    status: string;
    createdAt: Date;
    validUntil?: Date | null;
    modality?: string | null;
    incoterm?: string | null;
    origin?: string | null;
    destination?: string | null;
    shippingType?: string | null;
    shippingLine?: string | null;
    frequency?: string | null;
    transitTime?: string | null;
    etd?: string | null;
    eta?: string | null;
    blNro?: string | null;
    shipper?: string | null;
    mercaderia?: string | null;
    formaPago?: string | null;
    cargoType?: string | null;
    packagesCount?: string | null;
    grossWeight?: string | null;
    volume?: string | null;
    loadType?: string | null;
    containersCount?: string | null;
    notes?: string | null;
    client: {
      businessName: string;
      documentType?: string | null;
      documentNumber?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
    };
    items: QuotationItemData[];
    totalUsd: number;
    totalPen: number;
    profitUsd: number;
    profitPen: number;
    operation?: { id: string } | null;
  };
}

export function QuotationActionsMenu({ quotation }: QuotationActionsMenuProps) {
  const [isPending, startTransition] = useTransition();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute Taxable & Non-Taxable Subtotals for PDF render
  let subtotalTaxableUsd = 0;
  let totalNonTaxableUsd = 0;
  let subtotalTaxablePen = 0;
  let totalNonTaxablePen = 0;

  quotation.items.forEach((item) => {
    if (item.currency === "PEN") {
      if (item.isTaxable) subtotalTaxablePen += item.total;
      else totalNonTaxablePen += item.total;
    } else {
      if (item.isTaxable) subtotalTaxableUsd += item.total;
      else totalNonTaxableUsd += item.total;
    }
  });

  subtotalTaxableUsd = Number(subtotalTaxableUsd.toFixed(2));
  const igvUsd = Number((subtotalTaxableUsd * 0.18).toFixed(2));
  const totalTaxableUsd = Number((subtotalTaxableUsd + igvUsd).toFixed(2));
  totalNonTaxableUsd = Number(totalNonTaxableUsd.toFixed(2));
  const grandTotalUsd = Number((totalTaxableUsd + totalNonTaxableUsd).toFixed(2));

  subtotalTaxablePen = Number(subtotalTaxablePen.toFixed(2));
  const igvPen = Number((subtotalTaxablePen * 0.18).toFixed(2));
  const totalTaxablePen = Number((subtotalTaxablePen + igvPen).toFixed(2));
  totalNonTaxablePen = Number(totalNonTaxablePen.toFixed(2));
  const grandTotalPen = Number((totalTaxablePen + totalNonTaxablePen).toFixed(2));

  const pdfData: QuotationPdfData = {
    code: quotation.code,
    createdAt: quotation.createdAt,
    validUntil: quotation.validUntil,
    modality: quotation.modality,
    incoterm: quotation.incoterm,
    origin: quotation.origin,
    destination: quotation.destination,
    shippingType: quotation.shippingType,
    shippingLine: quotation.shippingLine,
    frequency: quotation.frequency,
    transitTime: quotation.transitTime,
    etd: quotation.etd,
    eta: quotation.eta,
    blNro: quotation.blNro,
    shipper: quotation.shipper,
    mercaderia: quotation.mercaderia,
    formaPago: quotation.formaPago,
    cargoType: quotation.cargoType,
    packagesCount: quotation.packagesCount,
    grossWeight: quotation.grossWeight,
    volume: quotation.volume,
    loadType: quotation.loadType,
    containersCount: quotation.containersCount,
    notes: quotation.notes,
    client: {
      name: quotation.client.businessName,
      documentType: quotation.client.documentType,
      documentNumber: quotation.client.documentNumber,
      email: quotation.client.email,
      phone: quotation.client.phone,
      address: quotation.client.address,
    },
    items: quotation.items.map((i) => ({
      description: i.description,
      category: i.category ?? undefined,
      currency: i.currency,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      total: i.total,
      isTaxable: i.isTaxable,
    })),
    subtotalTaxableUsd,
    igvUsd,
    totalTaxableUsd,
    totalNonTaxableUsd,
    grandTotalUsd,
    subtotalTaxablePen,
    igvPen,
    totalTaxablePen,
    totalNonTaxablePen,
    grandTotalPen,
  };

  async function handleViewPdf() {
    try {
      setIsGeneratingPdf(true);
      const blob = await pdf(<QuotationPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Error al visualizar PDF:", err);
      alert("Ocurrió un error al generar la vista previa del PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setIsGeneratingPdf(true);
      const blob = await pdf(<QuotationPDF data={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cotizacion_${quotation.code.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
      a.click();
    } catch (err) {
      console.error("Error al descargar PDF:", err);
      alert("Ocurrió un error al descargar la cotización PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleConvertOperation() {
    startTransition(async () => {
      try {
        await createOperationFromQuotationAction(quotation.id);
      } catch (err: any) {
        alert(err.message || "Error al crear la operación.");
      }
    });
  }

  async function handleDeleteConfirm() {
    try {
      setIsDeleting(true);
      await deleteQuotationAction(quotation.id);
      setShowDeleteDialog(false);
    } catch (err: any) {
      alert(err.message || "Error al eliminar la cotización.");
    } finally {
      setIsDeleting(false);
    }
  }

  const hasOperation = Boolean(quotation.operation?.id) || quotation.status === "ACCEPTED";

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {/* Quick Eye Button for fast navigation */}
        <Link href={`/quotations/${quotation.id}`} title="Ver Detalles">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Link>

        {/* Compact Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending || isGeneratingPdf}
              className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              {isPending || isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/quotations/${quotation.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                <span>Ver Detalles</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleViewPdf} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4 text-indigo-600" />
              <span>Ver PDF</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDownloadPdf} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Descargar PDF</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Conditional Status Action */}
            {hasOperation && quotation.operation?.id ? (
              <DropdownMenuItem asChild>
                <Link href={`/operations/${quotation.operation.id}`} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4 text-blue-600" />
                  <span>Ver Operación</span>
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleConvertOperation} className="cursor-pointer">
                <Ship className="mr-2 h-4 w-4 text-emerald-600" />
                <span>Generar Operación</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600" />
              <span>Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Cotización #{quotation.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente la cotización y todos sus conceptos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Elimando...
                </>
              ) : (
                "Eliminar Cotización"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
