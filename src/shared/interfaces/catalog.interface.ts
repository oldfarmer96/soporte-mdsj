export type TicketPriority = "BAJO" | "MEDIO" | "ALTO" | "CRITICO";

export interface Area {
  id: string;
  name: string;
  shortName: string | null;
  floor: number | null;
  reference: string | null;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isCritical: boolean;
  isActive: boolean;
}

export interface ProblemType {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priority: TicketPriority;
  isActive: boolean;
}

export interface CatalogQueryOptions {
  includeInactive?: boolean;
}

export interface ProblemTypeQueryOptions extends CatalogQueryOptions {
  categoryId?: string;
}
