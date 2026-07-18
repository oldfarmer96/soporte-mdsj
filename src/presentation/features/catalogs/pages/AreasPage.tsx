import { useAreas } from "@/application/hooks/useCatalogs";
import { useSetAreaActive } from "@/application/hooks/useCatalogAdmin";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { Building2, MapPin } from "lucide-react";
import { useDeferredValue, useState } from "react";
import AreaFormDialog from "../components/AreaFormDialog";
import { CatalogStatusBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";
import CatalogStatusAction from "../components/CatalogStatusAction";
import CatalogToolbar, { type CatalogStatusFilter } from "../components/CatalogToolbar";

const formatFloor = (floor: number | null) => {
  if (floor === null) return "Piso no especificado";
  if (floor === 0) return "Planta baja";
  if (floor < 0) return `Sótano ${Math.abs(floor)}`;
  return `Piso ${floor}`;
};

const AreasPage = () => {
  const areasQuery = useAreas({ includeInactive: true });
  const statusMutation = useSetAreaActive();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatusFilter>("all");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("es"));
  const filteredAreas = areasQuery.data?.filter(
    (area) =>
      area.name.toLocaleLowerCase("es").includes(deferredSearch) &&
      (status === "all" || area.isActive === (status === "active")),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración de catálogos"
        title="Áreas"
        description="Crea, edita y controla las áreas disponibles para clasificar solicitudes."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Áreas" },
        ]}
        actions={<AreaFormDialog />}
      />

      <CatalogToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {areasQuery.isPending && <CatalogListSkeleton />}
      {areasQuery.isError && (
        <ErrorState onRetry={() => areasQuery.refetch()} />
      )}
      {areasQuery.isSuccess && filteredAreas?.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No encontramos áreas"
          description="Cambia la búsqueda o el estado, o crea una nueva área."
        />
      )}
      {areasQuery.isSuccess && filteredAreas && filteredAreas.length > 0 && (
        <ul className="grid gap-3" aria-label="Áreas registradas">
          {filteredAreas.map((area) => (
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
                <div className="flex flex-wrap items-center gap-2">
                  <CatalogStatusBadge isActive={area.isActive} />
                  <AreaFormDialog area={area} />
                  <CatalogStatusAction
                    id={`area-${area.id}`}
                    name={area.name}
                    isActive={area.isActive}
                    onConfirm={() =>
                      statusMutation.mutateAsync({ id: area.id, isActive: !area.isActive })
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};

export default AreasPage;
