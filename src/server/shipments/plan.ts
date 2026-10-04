import type { Direction, MilestonePhase, Responsible, ServiceMode, ShipmentStatus } from "@/generated/prisma/enums";

/** Orden del estado general; sirve para saber qué hitos ya quedaron atrás. */
export const STATUS_RANK: Record<ShipmentStatus, number> = {
  QUOTING: -1,
  CONFIRMED: 0,
  AT_ORIGIN: 1,
  IN_TRANSIT: 2,
  AT_DESTINATION: 3,
  CUSTOMS_CLEARANCE: 4,
  RELEASED: 5,
  OUT_FOR_DELIVERY: 6,
  DELIVERED: 7,
  CLOSED: 8,
  LOST: -2,
  CANCELLED: -2,
};

export interface ShipmentScope {
  direction: Direction;
  mode: ServiceMode;
  includesFreight: boolean;
  includesCustoms: boolean;
  includesInland: boolean;
}

export interface MilestoneDef {
  id: string;
  name: string;
  clientLabel: string;
  directions: Direction[];
  modes: ServiceMode[];
  requiresFreight: boolean;
  requiresCustoms: boolean;
  requiresInland: boolean;
  setsStatus: ShipmentStatus | null;
  phase: MilestonePhase;
  clientVisible: boolean;
  notifyClient: boolean;
  sortOrder: number;
  isActive: boolean;
}

/** Hitos que aplican a un expediente según dirección, modo y servicios contratados (opcionalmente de una sola etapa). */
export function applicableMilestones<T extends MilestoneDef>(defs: T[], scope: ShipmentScope, phase?: MilestonePhase): T[] {
  return defs
    .filter(
      (d) =>
        d.isActive &&
        (!phase || d.phase === phase) &&
        d.directions.includes(scope.direction) &&
        (d.modes.length === 0 || d.modes.includes(scope.mode)) &&
        (!d.requiresFreight || scope.includesFreight) &&
        (!d.requiresCustoms || scope.includesCustoms) &&
        (!d.requiresInland || scope.includesInland),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Para un embarque que ya va por cierto estado (p. ej. importado del sistema anterior),
 * indica qué hitos se consideran cumplidos: los que llevan a ese estado o a uno anterior,
 * y los intermedios que están antes del último cumplido.
 */
export function milestonesDoneUpTo<T extends MilestoneDef>(milestones: T[], status: ShipmentStatus): Set<string> {
  const rank = STATUS_RANK[status];
  let lastDoneIndex = -1;
  milestones.forEach((m, i) => {
    if (m.setsStatus && STATUS_RANK[m.setsStatus] <= rank) lastDoneIndex = i;
  });
  return new Set(milestones.slice(0, lastDoneIndex + 1).map((m) => m.id));
}

export interface DocumentTypeDef {
  id: string;
  name: string;
  defaultResponsible: Responsible;
  requiredForDirections: Direction[];
  requiredForModes: ServiceMode[];
  requiredWhenCustoms: boolean;
  sortOrder: number;
  isActive: boolean;
}

/** Documentos que se piden automáticamente para un embarque (checklist). */
export function applicableRequirements<T extends DocumentTypeDef>(types: T[], scope: ShipmentScope): T[] {
  return types
    .filter(
      (t) =>
        t.isActive &&
        t.requiredForDirections.includes(scope.direction) &&
        (t.requiredForModes.length === 0 || t.requiredForModes.includes(scope.mode)) &&
        (!t.requiredWhenCustoms || scope.includesCustoms),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
