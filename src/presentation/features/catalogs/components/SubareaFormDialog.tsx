import {
  useCreateSubarea,
  useUpdateSubarea,
} from "@/application/hooks/useCatalogAdmin";
import FieldInfo from "@/presentation/components/FieldInfo";
import type { Area, Subarea } from "@/shared/interfaces/catalog.interface";
import { getCatalogMutationErrorMessage } from "@/services/catalog.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Pencil, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  subareaFormSchema,
  type SubareaForm,
} from "../schemas/catalogAdmin.schema";

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

const SubareaFormDialog = ({
  subarea,
  areas,
}: {
  subarea?: Subarea;
  areas: Area[];
}) => {
  const createMutation = useCreateSubarea();
  const updateMutation = useUpdateSubarea();
  const dialogId = subarea ? `edit-subarea-${subarea.id}` : "create-subarea";
  const form = useForm<SubareaForm>({
    resolver: zodResolver(subareaFormSchema),
    defaultValues: {
      areaId: subarea?.areaId ?? "",
      name: subarea?.name ?? "",
      shortName: subarea?.shortName ?? "",
      description: subarea?.description ?? "",
    },
  });
  const mutation = subarea ? updateMutation : createMutation;

  const submit = (values: SubareaForm) => {
    const payload = {
      areaId: values.areaId,
      name: values.name,
      shortName: values.shortName || null,
      description: values.description || null,
    };
    const options = {
      onSuccess: () => {
        getDialog(dialogId)?.close();
        if (!subarea) form.reset();
      },
    };
    if (subarea) updateMutation.mutate({ id: subarea.id, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return (
    <>
      <button
        type="button"
        className={subarea ? "btn btn-sm" : "btn btn-primary"}
        disabled={areas.length === 0}
        onClick={() => {
          mutation.reset();
          form.reset({
            areaId: subarea?.areaId ?? "",
            name: subarea?.name ?? "",
            shortName: subarea?.shortName ?? "",
            description: subarea?.description ?? "",
          });
          getDialog(dialogId)?.showModal();
        }}
      >
        {subarea ? (
          <Pencil className="size-4" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        {subarea ? "Editar" : "Nueva subárea"}
      </button>

      <dialog id={dialogId} className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {subarea ? "Editar subárea" : "Nueva subárea"}
              </h2>
              <p className="mt-2 text-sm text-base-content/65">
                Asocia la unidad o dependencia a su área municipal.
              </p>
            </div>
            <form method="dialog">
              <button
                className="btn btn-ghost btn-square btn-sm"
                aria-label="Cerrar"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit(submit)}
            noValidate
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Área</legend>
              <select
                {...form.register("areaId")}
                className={`select w-full ${form.formState.errors.areaId ? "select-error" : ""}`}
              >
                <option value="">Selecciona un área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                    {area.isActive ? "" : " (inactiva)"}
                  </option>
                ))}
              </select>
              <FieldInfo
                id="subarea-area-error"
                error={form.formState.errors.areaId}
              />
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nombre</legend>
                <input
                  {...form.register("name")}
                  className={`input w-full ${form.formState.errors.name ? "input-error" : ""}`}
                  maxLength={150}
                />
                <FieldInfo
                  id="subarea-name-error"
                  error={form.formState.errors.name}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nombre corto</legend>
                <input
                  {...form.register("shortName")}
                  className="input w-full"
                  maxLength={30}
                />
                <FieldInfo
                  id="subarea-short-name-error"
                  error={form.formState.errors.shortName}
                />
              </fieldset>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Descripción</legend>
              <textarea
                {...form.register("description")}
                className="textarea min-h-24 w-full"
                maxLength={300}
              />
              <FieldInfo
                id="subarea-description-error"
                error={form.formState.errors.description}
              />
            </fieldset>

            {mutation.isError && (
              <div className="alert alert-error alert-soft">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <span>{getCatalogMutationErrorMessage(mutation.error)}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => getDialog(dialogId)?.close()}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                {subarea ? "Guardar cambios" : "Crear subárea"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
        </form>
      </dialog>
    </>
  );
};

export default SubareaFormDialog;
