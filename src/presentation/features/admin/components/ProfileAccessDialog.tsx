import { useUpdateProfileAccess } from "@/application/hooks/useProfiles";
import FieldInfo from "@/presentation/components/FieldInfo";
import type { ProfileListItem } from "@/shared/interfaces/profile.interface";
import { getProfileMutationErrorMessage } from "@/services/profile.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Settings2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  profileAccessSchema,
  type ProfileAccessForm,
} from "../schemas/profileAdmin.schema";

const ROLE_LABELS = {
  SOLICITANTE: "Solicitante",
  APOYO: "Personal de apoyo",
  ADMIN: "Administrador",
} as const;

const STATUS_LABELS = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  BLOQUEADO: "Bloqueado",
} as const;

const ProfileAccessDialog = ({ profile }: { profile: ProfileListItem }) => {
  const mutation = useUpdateProfileAccess();
  const dialogId = `profile-access-${profile.id}`;
  const form = useForm<ProfileAccessForm>({
    resolver: zodResolver(profileAccessSchema),
    defaultValues: { role: profile.role, status: profile.status },
  });
  const dialog = () =>
    document.getElementById(dialogId) as HTMLDialogElement | null;

  const submit = (values: ProfileAccessForm) => {
    mutation.mutate(
      {
        profileId: profile.id,
        role: values.role,
        status: values.status,
      },
      { onSuccess: () => dialog()?.close() },
    );
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => {
          mutation.reset();
          form.reset({ role: profile.role, status: profile.status });
          dialog()?.showModal();
        }}
      >
        <Settings2 className="size-4" aria-hidden="true" />
        Gestionar
      </button>

      <dialog id={dialogId} className="modal">
        <div className="modal-box max-w-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Gestionar acceso</h2>
              <p className="mt-2 text-sm text-base-content/65">
                {profile.firstName} {profile.lastName} · DNI {profile.dni}
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
              <legend className="fieldset-legend">Rol</legend>
              <select {...form.register("role")} className="select w-full">
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldInfo
                id={`profile-role-error-${profile.id}`}
                error={form.formState.errors.role}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Estado</legend>
              <select {...form.register("status")} className="select w-full">
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldInfo
                id={`profile-status-error-${profile.id}`}
                error={form.formState.errors.status}
              />
            </fieldset>

            <div className="alert alert-warning alert-soft items-start">
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <p className="text-sm">
                Un usuario de apoyo con tickets activos debe reasignarlos antes
                de cambiar de rol o estado.
              </p>
            </div>

            {mutation.isError && (
              <div className="alert alert-error alert-soft" role="alert">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <span>{getProfileMutationErrorMessage(mutation.error)}</span>
              </div>
            )}

            <div className="modal-action">
              <button type="button" className="btn" onClick={() => dialog()?.close()}>
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
                Guardar acceso
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

export default ProfileAccessDialog;
