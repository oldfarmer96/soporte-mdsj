export type TicketPriority = "BAJO" | "MEDIO" | "ALTO" | "CRITICO";

export interface Area {
  id: string;
  name: string;
  shortName: string | null;
  floor: number | null;
  reference: string | null;
  isOther: boolean;
  isActive: boolean;
}

export interface Subarea {
  id: string;
  areaId: string;
  name: string;
  shortName: string | null;
  description: string | null;
  isOther: boolean;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isCritical: boolean;
  isOther: boolean;
  isActive: boolean;
}

export interface ProblemType {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priority: TicketPriority;
  isOther: boolean;
  isActive: boolean;
}

export interface CatalogQueryOptions {
  includeInactive?: boolean;
}

export interface ProblemTypeQueryOptions extends CatalogQueryOptions {
  categoryId?: string;
}

export interface SubareaQueryOptions extends CatalogQueryOptions {
  areaId?: string;
}

export interface AreaPayload {
  name: string;
  shortName: string | null;
  floor: number | null;
  reference: string | null;
}

export interface SubareaPayload {
  areaId: string;
  name: string;
  shortName: string | null;
  description: string | null;
}

export interface CategoryPayload {
  name: string;
  description: string | null;
  isCritical: boolean;
}

export interface ProblemTypePayload {
  categoryId: string;
  name: string;
  description: string | null;
  priority: TicketPriority;
}
