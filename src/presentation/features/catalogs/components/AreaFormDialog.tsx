import { useCreateArea, useUpdateArea } from "@/application/hooks/useCatalogAdmin";
import FieldInfo from "@/presentation/components/FieldInfo";
import type { Area } from "@/shared/interfaces/catalog.interface";
import { getCatalogMutationErrorMessage } from "@/services/catalog.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Pencil, Plus, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { areaFormSchema, type AreaForm } from "../schemas/catalogAdmin.schema";

const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

const AreaFormDialog = ({ area }: { area?: Area }) => {
  const createMutation = useCreateArea();
  const updateMutation = useUpdateArea();
  const dialogId = area ? `edit-area-${area.id}` : "create-area";
  const form = useForm<AreaForm>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: area?.name ?? "",
      shortName: area?.shortName ?? "",
      floor: area?.floor === null || area?.floor === undefined ? "" : String(area.floor),
      reference: area?.reference ?? "",
    },
  });
  const mutation = area ? updateMutation : createMutation;

  const submit = (values: AreaForm) => {
    const payload = {
      name: values.name,
      shortName: values.shortName || null,
      floor: values.floor === "" ? null : Number(values.floor),
      reference: values.reference || null,
    };
    const options = {
      onSuccess: () => {
        getDialog(dialogId)?.close();
        if (!area) form.reset();
      },
    };
    if (area) updateMutation.mutate({ id: area.id, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return (
    <>
      <button
        type="button"
        className={area ? "btn btn-sm" : "btn btn-primary"}
        onClick={() => {
          mutation.reset();
          form.reset({
            name: area?.name ?? "",
            shortName: area?.shortName ?? "",
            floor:
              area?.floor === null || area?.floor === undefined ? "" : String(area.floor),
            reference: area?.reference ?? "",
          });
          getDialog(dialogId)?.showModal();
        }}
      >
        {area ? <Pencil className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        {area ? "Editar" : "Nueva área"}
      </button>
      <dialog id={dialogId} className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">{area ? "Editar área" : "Nueva área"}</h2>
              <p className="mt-2 text-sm text-base-content/65">
                Define el nombre, ubicación y referencia utilizada al registrar tickets.
              </p>
            </div>
            <form method="dialog"><button className="btn btn-ghost btn-square btn-sm" aria-label="Cerrar"><X className="size-4" /></button></form>
          </div>
          <form className="mt-5 space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nombre</legend>
              <Controller
                control={form.control}
                name="name"
                render={({ field }) => (
                  <input {...field} className={`input w-full ${form.formState.errors.name ? "input-error" : ""}`} maxLength={150} />
                )}
              />
              <FieldInfo id="area-name-error" error={form.formState.errors.name} />
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nombre corto</legend>
                <Controller
                  control={form.control}
                  name="shortName"
                  render={({ field }) => (
                    <input {...field} className="input w-full" maxLength={30} />
                  )}
                />
                <FieldInfo id="area-short-name-error" error={form.formState.errors.shortName} />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Piso</legend>
                <Controller
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <input {...field} type="number" min={-2} max={20} step={1} className={`input w-full ${form.formState.errors.floor ? "input-error" : ""}`} />
                  )}
                />
                <FieldInfo id="area-floor-error" error={form.formState.errors.floor} />
              </fieldset>
            </div>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Referencia</legend>
              <Controller
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <textarea {...field} className="textarea min-h-24 w-full" maxLength={250} />
                )}
              />
              <FieldInfo id="area-reference-error" error={form.formState.errors.reference} />
            </fieldset>
            {mutation.isError && <div className="alert alert-error alert-soft"><AlertTriangle className="size-5" /><span>{getCatalogMutationErrorMessage(mutation.error)}</span></div>}
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => getDialog(dialogId)?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending || Boolean(area && !form.formState.isDirty)}>{mutation.isPending && <span className="loading loading-spinner loading-sm" />}{area && !form.formState.isDirty ? "Sin cambios" : area ? "Guardar cambios" : "Crear área"}</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>
    </>
  );
};

export default AreaFormDialog;
