import {
  useCreateProblemType,
  useUpdateProblemType,
} from "@/application/hooks/useCatalogAdmin";
import FieldInfo from "@/presentation/components/FieldInfo";
import type {
  Category,
  ProblemType,
  TicketPriority,
} from "@/shared/interfaces/catalog.interface";
import { getCatalogMutationErrorMessage } from "@/services/catalog.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Pencil, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  problemTypeFormSchema,
  type ProblemTypeForm,
} from "../schemas/catalogAdmin.schema";

const PRIORITIES: Array<{ value: TicketPriority; label: string }> = [
  { value: "BAJO", label: "Baja" },
  { value: "MEDIO", label: "Media" },
  { value: "ALTO", label: "Alta" },
  { value: "CRITICO", label: "Crítica" },
];
const getDialog = (dialogId: string) =>
  document.getElementById(dialogId) as HTMLDialogElement | null;

const ProblemTypeFormDialog = ({
  problemType,
  categories,
}: {
  problemType?: ProblemType;
  categories: Category[];
}) => {
  const createMutation = useCreateProblemType();
  const updateMutation = useUpdateProblemType();
  const dialogId = problemType
    ? `edit-problem-type-${problemType.id}`
    : "create-problem-type";
  const form = useForm<ProblemTypeForm>({
    resolver: zodResolver(problemTypeFormSchema),
    defaultValues: {
      categoryId: problemType?.categoryId ?? "",
      name: problemType?.name ?? "",
      description: problemType?.description ?? "",
      priority: problemType?.priority ?? "MEDIO",
    },
  });
  const mutation = problemType ? updateMutation : createMutation;

  const submit = (values: ProblemTypeForm) => {
    const payload = {
      categoryId: values.categoryId,
      name: values.name,
      description: values.description || null,
      priority: values.priority,
    };
    const options = {
      onSuccess: () => {
        getDialog(dialogId)?.close();
        if (!problemType) form.reset();
      },
    };
    if (problemType) updateMutation.mutate({ id: problemType.id, payload }, options);
    else createMutation.mutate(payload, options);
  };

  return (
    <>
      <button
        type="button"
        className={problemType ? "btn btn-sm" : "btn btn-primary"}
        disabled={categories.length === 0}
        onClick={() => {
          mutation.reset();
          form.reset({
            categoryId: problemType?.categoryId ?? "",
            name: problemType?.name ?? "",
            description: problemType?.description ?? "",
            priority: problemType?.priority ?? "MEDIO",
          });
          getDialog(dialogId)?.showModal();
        }}
      >
        {problemType ? (
          <Pencil className="size-4" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        {problemType ? "Editar" : "Nuevo tipo"}
      </button>
      <dialog id={dialogId} className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {problemType ? "Editar tipo de problema" : "Nuevo tipo de problema"}
              </h2>
              <p className="mt-2 text-sm text-base-content/65">
                Asocia el tipo a una categoría y define su prioridad base.
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
              <legend className="fieldset-legend">Categoría</legend>
              <select
                {...form.register("categoryId")}
                className={`select w-full ${form.formState.errors.categoryId ? "select-error" : ""}`}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}{category.isActive ? "" : " (inactiva)"}
                  </option>
                ))}
              </select>
              <FieldInfo
                id="problem-category-error"
                error={form.formState.errors.categoryId}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nombre</legend>
              <input
                {...form.register("name")}
                className={`input w-full ${form.formState.errors.name ? "input-error" : ""}`}
                maxLength={150}
              />
              <FieldInfo id="problem-name-error" error={form.formState.errors.name} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Descripción</legend>
              <textarea
                {...form.register("description")}
                className="textarea min-h-24 w-full"
                maxLength={300}
              />
              <FieldInfo
                id="problem-description-error"
                error={form.formState.errors.description}
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prioridad base</legend>
              <select {...form.register("priority")} className="select w-full">
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </fieldset>
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
                {problemType ? "Guardar cambios" : "Crear tipo"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>Cerrar</button></form>
      </dialog>
    </>
  );
};

export default ProblemTypeFormDialog;
