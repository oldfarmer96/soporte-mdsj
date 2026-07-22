import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useId, useState, type PropsWithChildren } from "react";

interface CollapsibleFiltersProps extends PropsWithChildren {
  activeCount: number;
  title: string;
}

const CollapsibleFilters = ({
  activeCount,
  title,
  children,
}: CollapsibleFiltersProps) => {
  const [isOpen, setIsOpen] = useState(activeCount > 0);
  const contentId = useId();

  return (
    <section className="mb-5 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-base-200 text-base-content/65">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black">{title}</h2>
            <p className="text-xs text-base-content/55">
              {activeCount > 0
                ? `${activeCount} ${activeCount === 1 ? "filtro activo" : "filtros activos"}`
                : "Opciones de búsqueda"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0 gap-2"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="hidden sm:inline">{isOpen ? "Ocultar" : "Mostrar"}</span>
          <span className="sm:hidden">{isOpen ? "Cerrar" : "Abrir"}</span>
          <ChevronDown
            className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {isOpen && (
        <div id={contentId} className="border-t border-base-300 p-4 sm:p-5">
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleFilters;
