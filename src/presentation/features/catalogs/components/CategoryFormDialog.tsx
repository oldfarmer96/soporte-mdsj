import {
  useCreateCategory,
  useUpdateCategory,
} from "@/application/hooks/useCatalogAdmin";
import FieldInfo from "@/presentation/components/FieldInfo";
import type { Category } from "@/shared/interfaces/catalog.interface";
import { getCatalogMutationErrorMessage } from "@/services/catalog.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Pencil, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  categoryFormSchema,
  type CategoryForm,
} from "../schemas/catalogAdmin.schema";

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

const CategoryFormDialog = ({ category }: { category?: Category }) => {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const dialogId = category ? `edit-category-${category.id}` : "create-category";
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      isCritical: category?.isCritical ?? false,
    },
  });
  const mutation = category ? updateMutation : createMutation;

  const submit = (values: CategoryForm) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      isCritical: values.isCritical,
    };
    const options = {
      onSuccess: () => {
        getDialog(dialogId)?.close();
        if (!category) form.reset();
      },
    };
    if (category) updateMutation.mutate({ id: category.id, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return (
    <>
      <button
        type="button"
        className={category ? "btn btn-sm" : "btn btn-primary"}
        onClick={() => {
          mutation.reset();
          form.reset({
            name: category?.name ?? "",
            description: category?.description ?? "",
            isCritical: category?.isCritical ?? false,
          });
          getDialog(dialogId)?.showModal();
        }}
      >
        {category ? (
          <Pencil className="size-4" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        {category ? "Editar" : "Nueva categoría"}
      </button>
      <dialog id={dialogId} className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {category ? "Editar categoría" : "Nueva categoría"}
              </h2>
              <p className="mt-2 text-sm text-base-content/65">
                Las categorías críticas asignan prioridad crítica automáticamente.
              </p>
            </div>
            <form method="dialog">
              <button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar">
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
          <form className="mt-5 space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nombre</legend>
              <input
                {...form.register("name")}
                className={`input w-full ${form.formState.errors.name ? "input-error" : ""}`}
                maxLength={100}
              />
              <FieldInfo id="category-name-error" error={form.formState.errors.name} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Descripción</legend>
              <textarea
                {...form.register("description")}
                className="textarea min-h-28 w-full"
                maxLength={300}
              />
              <FieldInfo
                id="category-description-error"
                error={form.formState.errors.description}
              />
            </fieldset>
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-box bg-base-200 p-4">
              <span>
                <span className="block text-sm font-bold">Categoría crítica</span>
                <span className="mt-1 block text-xs text-base-content/60">
                  Los nuevos tickets de esta categoría tendrán prioridad crítica.
                </span>
              </span>
              <input {...form.register("isCritical")} type="checkbox" className="toggle" />
            </label>
            {mutation.isError && (
              <div className="alert alert-error alert-soft">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <span>{getCatalogMutationErrorMessage(mutation.error)}</span>
              </div>
            )}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => getDialog(dialogId)?.close()}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending && <span className="loading loading-spinner loading-sm" />}
                {category ? "Guardar cambios" : "Crear categoría"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>
    </>
  );
};

export default CategoryFormDialog;
