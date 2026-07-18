import {
  useCategories,
  useProblemTypes,
} from "@/application/hooks/useCatalogs";
import { useSetProblemTypeActive } from "@/application/hooks/useCatalogAdmin";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { ListTree } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { CatalogStatusBadge, PriorityBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";
import CatalogStatusAction from "../components/CatalogStatusAction";
import CatalogToolbar, { type CatalogStatusFilter } from "../components/CatalogToolbar";
import ProblemTypeFormDialog from "../components/ProblemTypeFormDialog";

const ProblemTypesPage = () => {
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatusFilter>("all");
  const statusMutation = useSetProblemTypeActive();
  const categoriesQuery = useCategories({ includeInactive: true });
  const problemTypesQuery = useProblemTypes({
    categoryId: categoryId || undefined,
    includeInactive: true,
  });
  const categoryNames = new Map(
    categoriesQuery.data?.map((category) => [category.id, category.name]),
  );
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("es"));
  const filteredProblemTypes = problemTypesQuery.data?.filter(
    (problemType) =>
      problemType.name.toLocaleLowerCase("es").includes(deferredSearch) &&
      (status === "all" || problemType.isActive === (status === "active")),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración de catálogos"
        title="Tipos de problema"
        description="Crea, edita y controla los problemas asociados a cada categoría."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Tipos de problema" },
        ]}
        actions={
          <ProblemTypeFormDialog categories={categoriesQuery.data ?? []} />
        }
      />

      <CatalogToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <div className="mb-5 rounded-box border border-base-300 bg-base-100 p-4 sm:flex sm:items-end sm:justify-between sm:gap-5 sm:p-5">
        <label className="form-control w-full max-w-md">
          <span className="label pb-2 font-bold">Filtrar por categoría</span>
          <select
            className="select w-full"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={categoriesQuery.isPending || categoriesQuery.isError}
          >
            <option value="">Todas las categorías</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? "" : " (inactiva)"}
              </option>
            ))}
          </select>
        </label>
        {problemTypesQuery.isSuccess && (
          <p className="mt-3 text-sm text-base-content/60 sm:mt-0 sm:pb-3">
            {filteredProblemTypes?.length ?? 0} resultados
          </p>
        )}
      </div>

      {categoriesQuery.isError && (
        <ErrorState
          title="No pudimos cargar las categorías"
          onRetry={() => categoriesQuery.refetch()}
        />
      )}
      {!categoriesQuery.isError && problemTypesQuery.isPending && (
        <CatalogListSkeleton />
      )}
      {!categoriesQuery.isError && problemTypesQuery.isError && (
        <ErrorState onRetry={() => problemTypesQuery.refetch()} />
      )}
      {!categoriesQuery.isError &&
        problemTypesQuery.isSuccess &&
        filteredProblemTypes?.length === 0 && (
          <EmptyState
            icon={ListTree}
            title="No hay tipos de problema"
            description={
              categoryId
                ? "La categoría seleccionada no tiene tipos de problema visibles."
                : "El catálogo no devolvió tipos de problema visibles para tu usuario."
            }
          />
        )}
      {!categoriesQuery.isError &&
        problemTypesQuery.isSuccess &&
        filteredProblemTypes &&
        filteredProblemTypes.length > 0 && (
          <ul
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Tipos de problema registrados"
          >
            {filteredProblemTypes.map((problemType) => (
              <li
                key={problemType.id}
                className="flex min-h-44 flex-col rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-base font-black sm:text-lg">
                    {problemType.name}
                  </h2>
                  <CatalogStatusBadge isActive={problemType.isActive} />
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-base-content/50">
                  {categoryNames.get(problemType.categoryId) ??
                    "Categoría no disponible"}
                </p>
                <p className="mt-3 grow text-sm leading-relaxed text-base-content/65">
                  {problemType.description ?? "Sin descripción registrada."}
                </p>
                <div className="mt-4">
                  <PriorityBadge priority={problemType.priority} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-base-300 pt-4">
                  <ProblemTypeFormDialog
                    problemType={problemType}
                    categories={categoriesQuery.data ?? []}
                  />
                  <CatalogStatusAction
                    id={`problem-type-${problemType.id}`}
                    name={problemType.name}
                    isActive={problemType.isActive}
                    onConfirm={() =>
                      statusMutation.mutateAsync({
                        id: problemType.id,
                        isActive: !problemType.isActive,
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
    </PageContainer>
  );
};

export default ProblemTypesPage;
