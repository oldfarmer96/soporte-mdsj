import { useCategories } from "@/application/hooks/useCatalogs";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { Tags, TriangleAlert } from "lucide-react";
import { CatalogStatusBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";

const CategoriesPage = () => {
  const categoriesQuery = useCategories({ includeInactive: true });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Catálogos de lectura"
        title="Categorías"
        description="Consulta la clasificación general utilizada por la mesa de soporte."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Categorías" },
        ]}
        actions={<span className="badge badge-outline">Solo lectura</span>}
      />

      {categoriesQuery.isPending && <CatalogListSkeleton />}
      {categoriesQuery.isError && (
        <ErrorState onRetry={() => categoriesQuery.refetch()} />
      )}
      {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
        <EmptyState
          icon={Tags}
          title="No hay categorías registradas"
          description="El catálogo no devolvió categorías visibles para tu usuario."
        />
      )}
      {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
        <ul
          className="grid gap-3 sm:grid-cols-2"
          aria-label="Categorías registradas"
        >
          {categoriesQuery.data.map((category) => (
            <li
              key={category.id}
              className="flex min-h-44 flex-col rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-base font-black sm:text-lg">
                  {category.name}
                </h2>
                <CatalogStatusBadge isActive={category.isActive} />
              </div>
              <p className="mt-3 grow text-sm leading-relaxed text-base-content/65">
                {category.description ?? "Sin descripción registrada."}
              </p>
              {category.isCritical && (
                <span className="mt-4 flex items-center gap-2 text-sm font-bold text-warning">
                  <TriangleAlert className="size-4" aria-hidden="true" />
                  Categoría crítica
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};

export default CategoriesPage;
