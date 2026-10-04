"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Trash2, Loader2, ArrowRight } from "lucide-react";
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
import { deleteExpedientAction } from "@/app/expedients/actions";

interface ExpedientActionsMenuProps {
  expedient: {
    id: string;
    code: string;
    externalCode?: string | null;
    operationsCount?: number;
  };
}

export function ExpedientActionsMenu({ expedient }: ExpedientActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteConfirm() {
    try {
      setIsDeleting(true);
      await deleteExpedientAction(expedient.id);
      setShowDeleteDialog(false);
    } catch (err: any) {
      alert(err?.message || "Error al eliminar el expediente.");
    } finally {
      setIsDeleting(false);
    }
  }

  const displayCode = expedient.externalCode || expedient.code;

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Link href={`/expedients/${expedient.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
          >
            <span>Ver</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/expedients/${expedient.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                <span>Ver Detalles</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium"
            >
              <Trash2 className="mr-2 h-4 w-4 text-red-600" />
              <span>Eliminar Expediente</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              ¿Eliminar Expediente {displayCode}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-xs">
              Esta acción eliminará el expediente y sus cotizaciones no aceptadas. Solo es permitido si no existen operaciones activas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs h-8">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Elimando...
                </>
              ) : (
                "Eliminar Expediente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
