"use client";

import { useTransition } from "react";
import { Ship, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createOperationFromQuotationAction } from "@/app/operations/actions";

interface ConvertQuotationButtonProps {
  quotationId: string;
  existingOperationId?: string | null;
}

export function ConvertQuotationButton({
  quotationId,
  existingOperationId,
}: ConvertQuotationButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (existingOperationId) {
    return (
      <Link href={`/operations/${existingOperationId}`}>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Ship className="mr-1.5 h-3.5 w-3.5" /> Ver Operación <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </Link>
    );
  }

  function handleConvert() {
    startTransition(async () => {
      await createOperationFromQuotationAction(quotationId);
    });
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleConvert}
      disabled={isPending}
      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generando...
        </>
      ) : (
        <>
          <Ship className="mr-1.5 h-3.5 w-3.5" /> Generar Operación
        </>
      )}
    </Button>
  );
}
