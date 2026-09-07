import { Users, Mail, Phone, MapPin } from "lucide-react";
import prisma from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateClientDialog } from "@/components/create-client-dialog";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-sm text-slate-500">
            Gestiona los importadores, exportadores y empresas registradas para agendamiento aduanero.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      {/* Clients Table Card */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-3">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No hay clientes registrados</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Empieza registrando tu primer cliente o empresa para generar cotizaciones y operaciones de aduana.
            </p>
            <div className="mt-4">
              <CreateClientDialog />
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Razón Social / Nombre</TableHead>
                <TableHead className="font-semibold text-slate-700">Contacto</TableHead>
                <TableHead className="font-semibold text-slate-700">Dirección Fiscal</TableHead>
                <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                <TableHead className="font-semibold text-slate-700">Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-slate-600">
                      {client.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {!client.email && !client.phone && <span className="text-slate-400">Sin contacto</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {client.address ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[240px]">{client.address}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">No registrada</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === "ACTIVE" ? "success" : "secondary"}>
                      {client.status === "ACTIVE" ? "Activo" : client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(client.createdAt).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
