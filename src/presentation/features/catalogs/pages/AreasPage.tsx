import { useAreas } from "@/application/hooks/useCatalogs";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { Building2, MapPin } from "lucide-react";
import { CatalogStatusBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";

const formatFloor = (floor: number | null) => {
  if (floor === null) return "Piso no especificado";
  if (floor === 0) return "Planta baja";
  if (floor < 0) return `Sótano ${Math.abs(floor)}`;
  return `Piso ${floor}`;
};

const AreasPage = () => {
  const areasQuery = useAreas({ includeInactive: true });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Catálogos de lectura"
        title="Áreas"
        description="Consulta las áreas y ubicaciones disponibles para clasificar las solicitudes de soporte."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Áreas" },
        ]}
        actions={<span className="badge badge-outline">Solo lectura</span>}
      />

      {areasQuery.isPending && <CatalogListSkeleton />}
      {areasQuery.isError && (
        <ErrorState onRetry={() => areasQuery.refetch()} />
      )}
      {areasQuery.isSuccess && areasQuery.data.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No hay áreas registradas"
          description="El catálogo no devolvió áreas visibles para tu usuario."
        />
      )}
      {areasQuery.isSuccess && areasQuery.data.length > 0 && (
        <ul className="grid gap-3" aria-label="Áreas registradas">
          {areasQuery.data.map((area) => (
            <li
              key={area.id}
              className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-black sm:text-lg">
                      {area.name}
                    </h2>
                    {area.shortName && (
                      <span className="badge badge-ghost">
                        {area.shortName}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-base-content/65">
                    <span className="flex items-center gap-2">
                      <Building2 className="size-4" aria-hidden="true" />
                      {formatFloor(area.floor)}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="wrap-break-word">
                        {area.reference ?? "Sin referencia"}
                      </span>
                    </span>
                  </div>
                </div>
                <CatalogStatusBadge isActive={area.isActive} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};

export default AreasPage;
