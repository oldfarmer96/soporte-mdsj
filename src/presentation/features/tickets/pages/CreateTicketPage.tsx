import { useTicketCatalogSelection } from "@/application/hooks/useCatalogs";
import { useCreateTicket } from "@/application/hooks/useTickets";
import FieldInfo from "@/presentation/components/FieldInfo";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import type { TicketImpact } from "@/shared/interfaces/ticket.interface";
import { getTicketErrorMessage } from "@/services/ticket.service";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CircleHelp,
  FileText,
  ListTree,
  MapPin,
  Send,
  Tags,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import {
  createTicketSchema,
  type CreateTicketForm,
} from "../schemas/createTicket.schema";

const IMPACT_OPTIONS: Array<{
  value: TicketImpact;
  label: string;
  description: string;
}> = [
  {
    value: "INDIVIDUAL",
    label: "Solo me afecta a mí",
    description: "El problema está limitado a mi usuario o equipo.",
  },
  {
    value: "USUARIOS_MULTIPLES",
    label: "Afecta a varias personas",
    description: "Más usuarios presentan el mismo inconveniente.",
  },
  {
    value: "TODA_EL_AREA",
    label: "Afecta a toda el área",
    description: "El equipo completo no puede trabajar con normalidad.",
  },
  {
    value: "SERVICIO_INTERRUMPIDO",
    label: "Servicio interrumpido",
    description: "Un servicio institucional está completamente detenido.",
  },
];

const CreateTicketPage = () => {
  const catalogs = useTicketCatalogSelection();
  const createTicketMutation = useCreateTicket();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, touchedFields },
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      areaId: "",
      subareaId: "",
      categoryId: "",
      problemTypeId: "",
      description: "",
      impact: "INDIVIDUAL",
      workStopped: false,
    },
  });
  const description = useWatch({ control, name: "description" });
  const catalogsUnavailable =
    catalogs.areasQuery.isError ||
    catalogs.subareasQuery.isError ||
    catalogs.categoriesQuery.isError ||
    catalogs.problemTypesQuery.isError;

  const areaRegistration = register("areaId", {
    onChange: (event) => {
      const nextAreaId = String(event.target.value);
      setValue("subareaId", "", {
        shouldValidate: Boolean(touchedFields.subareaId),
      });
      catalogs.selectArea(nextAreaId || null);
    },
  });

  const categoryRegistration = register("categoryId", {
    onChange: (event) => {
      const nextCategoryId = String(event.target.value);
      setValue("problemTypeId", "", {
        shouldValidate: Boolean(touchedFields.problemTypeId),
      });
      catalogs.selectCategory(nextCategoryId || null);
    },
  });

  const onSubmit = (form: CreateTicketForm) => {
    const category = catalogs.categoriesQuery.data?.find(
      (item) => item.id === form.categoryId,
    );
    const problemType = catalogs.problemTypesQuery.data?.find(
      (item) => item.id === form.problemTypeId,
    );
    if ((category?.isOther || problemType?.isOther) && form.description.length < 5) {
      setError("description", {
        message: "Describe el problema al seleccionar una opción Otro",
      });
      return;
    }

    createTicketMutation.mutate({
      areaId: form.areaId,
      subareaId: form.subareaId,
      categoryId: form.categoryId,
      problemTypeId: form.problemTypeId,
      description: form.description || null,
      impact: form.impact,
      workStopped: form.workStopped,
    });
  };

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Solicitante"
        title="Nuevo ticket"
        description="Describe el problema con suficiente detalle para que el personal de apoyo pueda atenderlo correctamente."
        breadcrumbs={[
          { label: "Inicio", path: "/" },
          { label: "Nuevo ticket" },
        ]}
      />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {catalogsUnavailable && (
          <div
            className="alert alert-error alert-soft alert-vertical sm:alert-horizontal"
            role="alert"
          >
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            <div className="grow">
              <p className="font-bold">No pudimos cargar los catálogos</p>
              <p className="mt-1 text-sm">
                Reintenta antes de enviar para seleccionar un área y una
                categoría válidas.
              </p>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                catalogs.areasQuery.refetch();
                if (catalogs.areaId) catalogs.subareasQuery.refetch();
                catalogs.categoriesQuery.refetch();
                if (catalogs.categoryId) catalogs.problemTypesQuery.refetch();
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-black sm:text-lg">
                Ubicación y clasificación
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                Indica dónde ocurre y qué tipo de ayuda necesitas.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Área</legend>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-base-content/45"
                  aria-hidden="true"
                />
                <select
                  {...areaRegistration}
                  className={`select w-full pl-10 ${errors.areaId ? "select-error" : ""}`}
                  disabled={
                    catalogs.areasQuery.isPending || catalogs.areasQuery.isError
                  }
                  aria-invalid={Boolean(errors.areaId)}
                  aria-describedby={
                    errors.areaId ? "ticket-area-error" : undefined
                  }
                >
                  <option value="">
                    {catalogs.areasQuery.isPending
                      ? "Cargando áreas..."
                      : "Selecciona un área"}
                  </option>
                  {catalogs.areasQuery.data?.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <FieldInfo id="ticket-area-error" error={errors.areaId} />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Subárea</legend>
              <div className="relative">
                <MapPin
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-base-content/45"
                  aria-hidden="true"
                />
                <select
                  {...register("subareaId", {
                    onChange: (event) =>
                      catalogs.selectSubarea(String(event.target.value) || null),
                  })}
                  className={`select w-full pl-10 ${errors.subareaId ? "select-error" : ""}`}
                  disabled={
                    !catalogs.areaId ||
                    catalogs.subareasQuery.isPending ||
                    catalogs.subareasQuery.isError
                  }
                  aria-invalid={Boolean(errors.subareaId)}
                  aria-describedby={
                    errors.subareaId ? "ticket-subarea-error" : undefined
                  }
                >
                  <option value="">
                    {!catalogs.areaId
                      ? "Selecciona primero un área"
                      : catalogs.subareasQuery.isPending
                        ? "Cargando subáreas..."
                        : "Selecciona una subárea"}
                  </option>
                  {catalogs.subareasQuery.data?.map((subarea) => (
                    <option key={subarea.id} value={subarea.id}>
                      {subarea.name}
                    </option>
                  ))}
                </select>
              </div>
              <FieldInfo id="ticket-subarea-error" error={errors.subareaId} />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Categoría</legend>
              <div className="relative">
                <Tags
                  className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-base-content/45"
                  aria-hidden="true"
                />
                <select
                  {...categoryRegistration}
                  className={`select w-full pl-10 ${errors.categoryId ? "select-error" : ""}`}
                  disabled={
                    catalogs.categoriesQuery.isPending ||
                    catalogs.categoriesQuery.isError
                  }
                  aria-invalid={Boolean(errors.categoryId)}
                  aria-describedby={
                    errors.categoryId ? "ticket-category-error" : undefined
                  }
                >
                  <option value="">
                    {catalogs.categoriesQuery.isPending
                      ? "Cargando categorías..."
                      : "Selecciona una categoría"}
                  </option>
                  {catalogs.categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <FieldInfo id="ticket-category-error" error={errors.categoryId} />
            </fieldset>
          </div>

          <fieldset className="fieldset mt-4">
            <legend className="fieldset-legend">Tipo de problema</legend>
            <div className="relative">
              <ListTree
                className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-base-content/45"
                aria-hidden="true"
              />
              <select
                {...register("problemTypeId", {
                  onChange: (event) =>
                    catalogs.selectProblemType(
                      String(event.target.value) || null,
                    ),
                })}
                className={`select w-full pl-10 ${errors.problemTypeId ? "select-error" : ""}`}
                disabled={
                  !catalogs.categoryId ||
                  catalogs.problemTypesQuery.isPending ||
                  catalogs.problemTypesQuery.isError
                }
                aria-invalid={Boolean(errors.problemTypeId)}
                aria-describedby={
                  errors.problemTypeId ? "ticket-problem-type-error" : undefined
                }
              >
                <option value="">
                  {!catalogs.categoryId
                    ? "Selecciona primero una categoría"
                    : catalogs.problemTypesQuery.isPending
                      ? "Cargando tipos..."
                      : "Selecciona un tipo de problema"}
                </option>
                {catalogs.problemTypesQuery.data?.map((problemType) => (
                  <option key={problemType.id} value={problemType.id}>
                    {problemType.name}
                  </option>
                ))}
              </select>
            </div>
            <FieldInfo
              id="ticket-problem-type-error"
              error={errors.problemTypeId}
            />
            {catalogs.problemTypesQuery.isError && (
              <p className="label text-error">
                No pudimos cargar los tipos de problema. Reintenta antes de
                enviar.
              </p>
            )}
          </fieldset>
        </section>

        <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-black sm:text-lg">Detalle adicional</h2>
              <p className="mt-1 text-sm text-base-content/60">
                Es opcional, excepto cuando selecciones una opción Otro.
              </p>
            </div>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Descripción</legend>
            <textarea
              {...register("description")}
              className={`textarea min-h-36 w-full resize-y ${
                errors.description ? "textarea-error" : ""
              }`}
              maxLength={3000}
              placeholder="Describe qué estabas haciendo, qué ocurrió y si aparece algún mensaje de error."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? "ticket-description-error"
                  : "ticket-description-help"
              }
            />
            <div className="flex justify-between gap-3">
              <FieldInfo
                id="ticket-description-error"
                error={errors.description}
              />
              <p id="ticket-description-help" className="label ml-auto">
                {description.length}/3000
              </p>
            </div>
          </fieldset>
        </section>

        <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200">
              <CircleHelp className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-black sm:text-lg">Impacto del problema</h2>
              <p className="mt-1 text-sm text-base-content/60">
                Esta información ayuda al sistema a calcular la prioridad.
              </p>
            </div>
          </div>

          <fieldset>
            <legend className="sr-only">Selecciona el impacto</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {IMPACT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-24 cursor-pointer items-start gap-3 rounded-box border border-base-300 p-4 transition-colors has-checked:border-primary has-checked:bg-primary/5"
                >
                  <input
                    {...register("impact")}
                    type="radio"
                    value={option.value}
                    className="radio mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-bold">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-base-content/60">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <FieldInfo id="ticket-impact-error" error={errors.impact} />
          </fieldset>

          <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-box bg-base-200 p-4">
            <span>
              <span className="block text-sm font-bold">
                ¿Tu trabajo está detenido?
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-base-content/60">
                Actívalo solo si no puedes continuar con tus funciones.
              </span>
            </span>
            <input
              {...register("workStopped")}
              type="checkbox"
              className="toggle shrink-0"
            />
          </label>
        </section>

        {createTicketMutation.isError && (
          <div
            className="alert alert-error alert-soft items-start"
            role="alert"
          >
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm leading-relaxed">
              {getTicketErrorMessage(createTicketMutation.error)}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pb-4 sm:flex-row sm:justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-lg w-full sm:w-auto sm:min-w-56"
            disabled={createTicketMutation.isPending || catalogsUnavailable}
          >
            {createTicketMutation.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Send className="size-5" aria-hidden="true" />
            )}
            {createTicketMutation.isPending
              ? "Registrando..."
              : "Registrar ticket"}
          </button>
        </div>
      </form>
    </PageContainer>
  );
};

export default CreateTicketPage;
