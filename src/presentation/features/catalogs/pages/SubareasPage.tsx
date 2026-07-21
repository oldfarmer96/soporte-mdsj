import { useSetSubareaActive } from "@/application/hooks/useCatalogAdmin";
import { useAreas, useSubareas } from "@/application/hooks/useCatalogs";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { GitBranch } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { CatalogStatusBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";
import CatalogStatusAction from "../components/CatalogStatusAction";
import CatalogToolbar, {
  type CatalogStatusFilter,
} from "../components/CatalogToolbar";
import SubareaFormDialog from "../components/SubareaFormDialog";

const SubareasPage = () => {
  const [areaId, setAreaId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatusFilter>("all");
  const areasQuery = useAreas({ includeInactive: true });
  const subareasQuery = useSubareas({
    areaId: areaId || undefined,
    includeInactive: true,
  });
  const statusMutation = useSetSubareaActive();
  const areaNames = new Map(
    areasQuery.data?.map((area) => [area.id, area.name]),
  );
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("es"));
  const filteredSubareas = subareasQuery.data?.filter(
    (subarea) =>
      subarea.name.toLocaleLowerCase("es").includes(deferredSearch) &&
      (status === "all" || subarea.isActive === (status === "active")),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración de catálogos"
        title="Subáreas"
        description="Administra las unidades y dependencias asociadas a cada área municipal."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Subáreas" },
        ]}
        actions={<SubareaFormDialog areas={areasQuery.data ?? []} />}
      />

      <CatalogToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <div className="mb-5 rounded-box border border-base-300 bg-base-100 p-4 sm:flex sm:items-end sm:justify-between sm:gap-5 sm:p-5">
        <label className="form-control w-full max-w-md">
          <span className="label pb-2 font-bold">Filtrar por área</span>
          <select
            className="select w-full"
            value={areaId}
            onChange={(event) => setAreaId(event.target.value)}
            disabled={areasQuery.isPending || areasQuery.isError}
          >
            <option value="">Todas las áreas</option>
            {areasQuery.data?.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
                {area.isActive ? "" : " (inactiva)"}
              </option>
            ))}
          </select>
        </label>
        {subareasQuery.isSuccess && (
          <p className="mt-3 text-sm text-base-content/60 sm:mt-0 sm:pb-3">
            {filteredSubareas?.length ?? 0} resultados
          </p>
        )}
      </div>

      {areasQuery.isError && (
        <ErrorState
          title="No pudimos cargar las áreas"
          onRetry={() => areasQuery.refetch()}
        />
      )}
      {!areasQuery.isError && subareasQuery.isPending && <CatalogListSkeleton />}
      {!areasQuery.isError && subareasQuery.isError && (
        <ErrorState onRetry={() => subareasQuery.refetch()} />
      )}
      {!areasQuery.isError &&
        subareasQuery.isSuccess &&
        filteredSubareas?.length === 0 && (
          <EmptyState
            icon={GitBranch}
            title="No hay subáreas"
            description="No encontramos subáreas con los filtros seleccionados."
          />
        )}
      {!areasQuery.isError &&
        subareasQuery.isSuccess &&
        filteredSubareas &&
        filteredSubareas.length > 0 && (
          <ul
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Subáreas registradas"
          >
            {filteredSubareas.map((subarea) => (
              <li
                key={subarea.id}
                className="flex min-h-40 flex-col rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-black sm:text-lg">
                    {subarea.name}
                  </h2>
                  <CatalogStatusBadge isActive={subarea.isActive} />
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-base-content/50">
                  {areaNames.get(subarea.areaId) ?? "Área no disponible"}
                </p>
                <p className="mt-3 grow text-sm leading-relaxed text-base-content/65">
                  {subarea.description ?? "Sin descripción registrada."}
                </p>
                {subarea.shortName && (
                  <p className="mt-3 text-xs font-semibold text-base-content/50">
                    Código: {subarea.shortName}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-base-300 pt-4">
                  {subarea.isOther ? (
                    <span className="text-xs text-base-content/55">
                      Opción administrada por el sistema
                    </span>
                  ) : (
                    <>
                      <SubareaFormDialog
                        subarea={subarea}
                        areas={areasQuery.data ?? []}
                      />
                      <CatalogStatusAction
                        id={`subarea-${subarea.id}`}
                        name={subarea.name}
                        isActive={subarea.isActive}
                        onConfirm={() =>
                          statusMutation.mutateAsync({
                            id: subarea.id,
                            isActive: !subarea.isActive,
                          })
                        }
                      />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
    </PageContainer>
  );
};

export default SubareasPage;
