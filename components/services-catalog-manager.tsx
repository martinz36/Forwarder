"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  PackageCheck,
  Tag,
  Loader2,
  DollarSign,
  Wallet,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { CATEGORY_OPTIONS } from "@/components/quotation-form";
import { createServiceAction, updateServiceAction, deleteServiceAction } from "@/app/services/actions";

interface ConceptItem {
  id: string;
  name: string;
  category: string;
  defaultCurrency: string;
  defaultCost: number | null;
  defaultPrice: number | null;
  isTaxable: boolean;
  createdAt: Date;
}

interface ServicesCatalogManagerProps {
  initialServices: ConceptItem[];
}

export function ServicesCatalogManager({ initialServices }: ServicesCatalogManagerProps) {
  const [services, setServices] = useState<ConceptItem[]>(initialServices);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConceptItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("GASTOS_LOCALES");
  const [defaultCurrency, setDefaultCurrency] = useState<"USD" | "PEN">("USD");
  const [defaultCost, setDefaultCost] = useState<string>("0");
  const [defaultPrice, setDefaultPrice] = useState<string>("0");
  const [isTaxable, setIsTaxable] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setName("");
    setCategory("GASTOS_LOCALES");
    setDefaultCurrency("USD");
    setDefaultCost("0");
    setDefaultPrice("0");
    setIsTaxable(true);
    setError(null);
    setDialogOpen(true);
  };

  const openEditModal = (item: ConceptItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || "GASTOS_LOCALES");
    setDefaultCurrency((item.defaultCurrency as "USD" | "PEN") || "USD");
    setDefaultCost(item.defaultCost !== null && item.defaultCost !== undefined ? String(item.defaultCost) : "0");
    setDefaultPrice(item.defaultPrice !== null && item.defaultPrice !== undefined ? String(item.defaultPrice) : "0");
    setIsTaxable(item.isTaxable !== false);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ingresa el nombre del concepto.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parsedCost = parseFloat(defaultCost) || 0;
      const parsedPrice = parseFloat(defaultPrice) || 0;

      if (editingItem) {
        const res = await updateServiceAction(editingItem.id, {
          name,
          category,
          defaultCurrency,
          defaultCost: parsedCost,
          defaultPrice: parsedPrice,
          isTaxable,
        });

        if (!res.success || !res.data) {
          setError(res.error || "Error al actualizar concepto.");
          return;
        }

        const updated = res.data as ConceptItem;
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const res = await createServiceAction({
          name,
          category,
          defaultCurrency,
          defaultCost: parsedCost,
          defaultPrice: parsedPrice,
          isTaxable,
        });

        if (!res.success || !res.data) {
          setError(res.error || "Error al crear concepto.");
          return;
        }

        const created = res.data as ConceptItem;
        setServices((prev) => [created, ...prev]);
      }

      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(typeof err?.message === "string" ? err.message : "Error al guardar el concepto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      const res = await deleteServiceAction(deleteId);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(res.error || "No se pudo eliminar el concepto.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el concepto.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter logic
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "TODAS" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Category Badge Mapper
  const getCategoryBadge = (catKey: string) => {
    switch (catKey) {
      case "GASTOS_ORIGEN":
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200">Gastos de Origen</Badge>;
      case "FLETE_INTERNACIONAL":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Flete Internacional</Badge>;
      case "SEGURO":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Seguro</Badge>;
      case "GASTOS_LOCALES":
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Gastos Locales</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Conceptos</span>
            <PackageCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{services.length}</div>
          <p className="text-[11px] text-slate-500">En catálogo oficial</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gastos Locales</span>
            <Tag className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {services.filter((s) => s.category === "GASTOS_LOCALES").length}
          </div>
          <p className="text-[11px] text-slate-500">Servicios aduaneros y puerto</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Origen & Fletes</span>
            <Layers className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {services.filter((s) => s.category === "GASTOS_ORIGEN" || s.category === "FLETE_INTERNACIONAL").length}
          </div>
          <p className="text-[11px] text-slate-500">Logística internacional</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Afectos a IGV</span>
            <CheckSquare className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-700">
            {services.filter((s) => s.isTaxable !== false).length}
          </div>
          <p className="text-[11px] text-slate-500">Facturación con 18% IGV</p>
        </div>
      </div>

      {/* Header Bar with Action & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border shadow-sm">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar concepto o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Categorías</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow">
          <Plus className="h-4 w-4" />
          <span>Nuevo Concepto</span>
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Concepto / Servicio</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Moneda</th>
                <th className="py-3 px-4 text-right">Costo Sugerido</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-center">IGV (18%)</th>
                <th className="py-3 px-4 text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                    No se encontraron conceptos en el catálogo.
                  </td>
                </tr>
              ) : (
                filteredServices.map((item) => {
                  const cost = item.defaultCost || 0;
                  const price = item.defaultPrice || 0;
                  const curr = (item.defaultCurrency as "USD" | "PEN") || "USD";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        {getCategoryBadge(item.category)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {curr}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        {formatCurrency(cost, curr)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-900">
                        {formatCurrency(price, curr)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isTaxable !== false ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                            <CheckSquare className="h-3 w-3 text-blue-600" />
                            18% Afecto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            <Square className="h-3 w-3 text-amber-600" />
                            Inafecto
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Editar Concepto"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                            className="h-7 w-7 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar Concepto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <PackageCheck className="h-5 w-5 text-blue-600" />
              <span>{editingItem ? "Editar Concepto del Catálogo" : "Nuevo Concepto de Servicio"}</span>
            </DialogTitle>
            <DialogDescription>
              Configura los valores sugeridos por defecto para su uso rápido en las cotizaciones comerciales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {error && (
              <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                {String(error)}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Nombre del Concepto / Servicio *
              </Label>
              <Input
                placeholder="Ej. GASTOS ADMINISTRATIVOS ADUANA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Categoría *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs focus:border-blue-500 focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Moneda por Defecto *</Label>
                <select
                  value={defaultCurrency}
                  onChange={(e: any) => setDefaultCurrency(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="USD">Dólares ($ USD)</option>
                  <option value="PEN">Soles (S/ PEN)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Costo Sugerido</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={defaultCost}
                  onChange={(e) => setDefaultCost(e.target.value)}
                  className="h-9 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-700">Precio Venta Sugerido</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
                  className="h-9 text-xs font-bold text-blue-900 border-blue-200"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-slate-700">Tratamiento Tributario (IGV)</Label>
              <button
                type="button"
                onClick={() => setIsTaxable(!isTaxable)}
                className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  isTaxable
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isTaxable ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-amber-600" />}
                  <span>{isTaxable ? "Afecto a IGV (18% Ley Peruana)" : "Inafecto a IGV (Reembolso / Origen)"}</span>
                </div>
              </button>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                <span>{editingItem ? "Guardar Cambios" : "Crear Concepto"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900">¿Eliminar concepto?</DialogTitle>
            <DialogDescription>
              Esta acción no afectará a las cotizaciones históricas creadas anteriormente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
