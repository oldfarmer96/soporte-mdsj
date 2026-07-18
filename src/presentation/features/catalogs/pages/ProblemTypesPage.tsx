import {
  useCategories,
  useProblemTypes,
} from "@/application/hooks/useCatalogs";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { ListTree } from "lucide-react";
import { useState } from "react";
import { CatalogStatusBadge, PriorityBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";

const ProblemTypesPage = () => {
  const [categoryId, setCategoryId] = useState("");
  const categoriesQuery = useCategories({ includeInactive: true });
  const problemTypesQuery = useProblemTypes({
    categoryId: categoryId || undefined,
    includeInactive: true,
  });
  const categoryNames = new Map(
    categoriesQuery.data?.map((category) => [category.id, category.name]),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Catálogos de lectura"
        title="Tipos de problema"
        description="Consulta los problemas asociados a cada categoría y la prioridad base definida para ellos."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Tipos de problema" },
        ]}
        actions={<span className="badge badge-outline">Solo lectura</span>}
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
            {problemTypesQuery.data.length} resultados
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
        problemTypesQuery.data.length === 0 && (
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
        problemTypesQuery.data.length > 0 && (
          <ul
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Tipos de problema registrados"
          >
            {problemTypesQuery.data.map((problemType) => (
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
              </li>
            ))}
          </ul>
        )}
    </PageContainer>
  );
};

export default ProblemTypesPage;
