import { useCategories } from "@/application/hooks/useCatalogs";
import { useSetCategoryActive } from "@/application/hooks/useCatalogAdmin";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { Tags, TriangleAlert } from "lucide-react";
import { useDeferredValue, useState } from "react";
import CategoryFormDialog from "../components/CategoryFormDialog";
import { CatalogStatusBadge } from "../components/CatalogBadges";
import CatalogListSkeleton from "../components/CatalogListSkeleton";
import CatalogStatusAction from "../components/CatalogStatusAction";
import CatalogToolbar, { type CatalogStatusFilter } from "../components/CatalogToolbar";

const CategoriesPage = () => {
  const categoriesQuery = useCategories({ includeInactive: true });
  const statusMutation = useSetCategoryActive();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatusFilter>("all");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("es"));
  const filteredCategories = categoriesQuery.data?.filter(
    (category) =>
      category.name.toLocaleLowerCase("es").includes(deferredSearch) &&
      (status === "all" || category.isActive === (status === "active")),
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración de catálogos"
        title="Categorías"
        description="Crea, edita y controla la clasificación general de la mesa de soporte."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Categorías" },
        ]}
        actions={<CategoryFormDialog />}
      />

      <CatalogToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {categoriesQuery.isPending && <CatalogListSkeleton />}
      {categoriesQuery.isError && (
        <ErrorState onRetry={() => categoriesQuery.refetch()} />
      )}
      {categoriesQuery.isSuccess && filteredCategories?.length === 0 && (
        <EmptyState
          icon={Tags}
          title="No encontramos categorías"
          description="Cambia la búsqueda o el estado, o crea una nueva categoría."
        />
      )}
      {categoriesQuery.isSuccess && filteredCategories && filteredCategories.length > 0 && (
        <ul
          className="grid gap-3 sm:grid-cols-2"
          aria-label="Categorías registradas"
        >
          {filteredCategories.map((category) => (
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
              <div className="mt-4 flex flex-wrap gap-2 border-t border-base-300 pt-4">
                <CategoryFormDialog category={category} />
                <CatalogStatusAction
                  id={`category-${category.id}`}
                  name={category.name}
                  isActive={category.isActive}
                  onConfirm={() =>
                    statusMutation.mutateAsync({
                      id: category.id,
                      isActive: !category.isActive,
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

export default CategoriesPage;
