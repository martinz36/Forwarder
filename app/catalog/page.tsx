import Link from "next/link";
import { Tags, Trash2, ArrowLeft, Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateConceptDialog } from "@/components/create-concept-dialog";
import { deleteConceptAction } from "@/app/catalog/actions";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const concepts = await prisma.conceptCatalog.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
            <Tags className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Catálogo de Conceptos y Servicios
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Plantillas predeterminadas de servicios, fletes y comisiones para cotización rápida.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreateConceptDialog triggerText="+ Nuevo Concepto" />
        </div>
      </div>

      {/* Concept Table Card */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">
            Plantillas Registradas ({concepts.length})
          </h2>
        </div>

        {concepts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed">
            No hay conceptos registrados en el catálogo aún. Presiona "+ Nuevo Concepto" para crear el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 text-left">#</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-left">Nombre del Concepto</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Moneda Base</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Precio Predeterminado</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Afectación IGV</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {concepts.map((concept, idx) => (
                  <TableRow key={concept.id}>
                    <TableCell className="font-bold text-slate-400 text-center text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 text-left text-xs">
                      {concept.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold text-xs font-mono">
                        {concept.defaultCurrency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-blue-900 text-sm">
                      {formatCurrency(concept.defaultPrice ?? 0, concept.defaultCurrency as "USD" | "PEN")}
                    </TableCell>
                    <TableCell className="text-center">
                      {concept.isTaxable ? (
                        <Badge className="bg-blue-100 text-blue-800 font-bold text-xs">
                          Afecto IGV 18%
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 font-bold text-xs">
                          Inafecto / Reembolso
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CreateConceptDialog conceptToEdit={concept} />
                        <form
                          action={async () => {
                            "use server";
                            await deleteConceptAction(concept.id);
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
