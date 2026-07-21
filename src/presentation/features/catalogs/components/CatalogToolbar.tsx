import CollapsibleFilters from "@/presentation/components/CollapsibleFilters";
import { Search } from "lucide-react";

export type CatalogStatusFilter = "all" | "active" | "inactive";

interface CatalogToolbarProps {
  search: string;
  status: CatalogStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: CatalogStatusFilter) => void;
}

const CatalogToolbar = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: CatalogToolbarProps) => {
  const activeFilterCount = Number(Boolean(search.trim())) + Number(status !== "all");

  return (
    <CollapsibleFilters activeCount={activeFilterCount} title="Buscar y filtrar">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Buscar por nombre</legend>
          <label className="input w-full">
            <Search className="size-4 opacity-45" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              maxLength={100}
              placeholder="Buscar catálogo"
            />
          </label>
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Estado</legend>
          <select
            className="select w-full"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as CatalogStatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </fieldset>
      </div>
    </CollapsibleFilters>
  );
};

export default CatalogToolbar;
