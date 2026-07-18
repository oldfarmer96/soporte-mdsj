import { catalogKeys } from "@/application/queryKeys/catalog.queryKeys";
import {
  getAreas,
  getCategories,
  getProblemTypes,
} from "@/services/catalog.service";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const CATALOG_STALE_TIME = 10 * 60 * 1000;

interface CatalogHookOptions {
  includeInactive?: boolean;
}

interface ProblemTypeHookOptions extends CatalogHookOptions {
  categoryId?: string | null;
}

export const useAreas = ({
  includeInactive = false,
}: CatalogHookOptions = {}) =>
  useQuery({
    queryKey: catalogKeys.areas(includeInactive),
    queryFn: () => getAreas({ includeInactive }),
    staleTime: CATALOG_STALE_TIME,
    retry: 2,
  });

export const useCategories = ({
  includeInactive = false,
}: CatalogHookOptions = {}) =>
  useQuery({
    queryKey: catalogKeys.categories(includeInactive),
    queryFn: () => getCategories({ includeInactive }),
    staleTime: CATALOG_STALE_TIME,
    retry: 2,
  });

export const useProblemTypes = ({
  categoryId,
  includeInactive = false,
}: ProblemTypeHookOptions = {}) =>
  useQuery({
    queryKey: catalogKeys.problemTypes({
      categoryId: categoryId ?? undefined,
      includeInactive,
    }),
    queryFn: () =>
      getProblemTypes({
        categoryId: categoryId ?? undefined,
        includeInactive,
      }),
    enabled: categoryId !== null,
    staleTime: CATALOG_STALE_TIME,
    retry: 2,
  });

export const useTicketCatalogSelection = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [problemTypeId, setProblemTypeId] = useState<string | null>(null);
  const areasQuery = useAreas();
  const categoriesQuery = useCategories();
  const problemTypesQuery = useProblemTypes({ categoryId });

  const selectCategory = (nextCategoryId: string | null) => {
    setCategoryId(nextCategoryId);
    setProblemTypeId(null);
  };

  return {
    areasQuery,
    categoriesQuery,
    problemTypesQuery,
    categoryId,
    problemTypeId,
    selectCategory,
    selectProblemType: setProblemTypeId,
  };
};
