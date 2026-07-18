import { catalogKeys } from "@/application/queryKeys/catalog.queryKeys";
import type {
  AreaPayload,
  CategoryPayload,
  ProblemTypePayload,
} from "@/shared/interfaces/catalog.interface";
import {
  createArea,
  createCategory,
  createProblemType,
  getCatalogMutationErrorMessage,
  setAreaActive,
  setCategoryActive,
  setProblemTypeActive,
  updateArea,
  updateCategory,
  updateProblemType,
} from "@/services/catalog.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const useCatalogMutation = <TVariables,>(
  mutationKey: string,
  mutationFn: (variables: TVariables) => Promise<void>,
  successMessage: string,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [mutationKey],
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      toast.success(successMessage);
    },
    onError: (error) => toast.error(getCatalogMutationErrorMessage(error)),
  });
};

export const useCreateArea = () =>
  useCatalogMutation("create-area", createArea, "Área creada correctamente");
export const useUpdateArea = () =>
  useCatalogMutation(
    "update-area",
    ({ id, payload }: { id: string; payload: AreaPayload }) => updateArea(id, payload),
    "Área actualizada correctamente",
  );
export const useSetAreaActive = () =>
  useCatalogMutation(
    "set-area-active",
    ({ id, isActive }: { id: string; isActive: boolean }) => setAreaActive(id, isActive),
    "Estado del área actualizado",
  );

export const useCreateCategory = () =>
  useCatalogMutation("create-category", createCategory, "Categoría creada correctamente");
export const useUpdateCategory = () =>
  useCatalogMutation(
    "update-category",
    ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      updateCategory(id, payload),
    "Categoría actualizada correctamente",
  );
export const useSetCategoryActive = () =>
  useCatalogMutation(
    "set-category-active",
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCategoryActive(id, isActive),
    "Estado de la categoría actualizado",
  );

export const useCreateProblemType = () =>
  useCatalogMutation(
    "create-problem-type",
    createProblemType,
    "Tipo de problema creado correctamente",
  );
export const useUpdateProblemType = () =>
  useCatalogMutation(
    "update-problem-type",
    ({ id, payload }: { id: string; payload: ProblemTypePayload }) =>
      updateProblemType(id, payload),
    "Tipo de problema actualizado correctamente",
  );
export const useSetProblemTypeActive = () =>
  useCatalogMutation(
    "set-problem-type-active",
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      setProblemTypeActive(id, isActive),
    "Estado del tipo de problema actualizado",
  );
