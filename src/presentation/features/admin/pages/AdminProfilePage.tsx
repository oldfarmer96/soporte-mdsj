import {
  useDniLookup,
  useLocalAdminApiStatus,
  useProfile,
  useResetProfilePassword,
  useUpdateManagedProfile,
} from "@/application/hooks/useProfiles";
import { useAuthStore } from "@/application/store/auth-store";
import ErrorState from "@/presentation/components/ErrorState";
import FieldInfo from "@/presentation/components/FieldInfo";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import PageSkeleton from "@/presentation/components/PageSkeleton";
import { getProfileMutationErrorMessage } from "@/services/profile.service";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowLeft,
  DatabaseZap,
  IdCard,
  KeyRound,
  Phone,
  RefreshCw,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { ProfileRoleBadge, ProfileStatusBadge } from "../components/ProfileBadges";
import {
  managedProfileSchema,
  type ManagedProfileForm,
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

const AdminProfilePage = () => {
  const { profileId = "" } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const profileQuery = useProfile(profileId);
  const updateProfile = useUpdateManagedProfile();
  const localApi = useLocalAdminApiStatus();
  const dniLookup = useDniLookup();
  const resetPassword = useResetProfilePassword();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const form = useForm<ManagedProfileForm>({
    resolver: zodResolver(managedProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      role: "SOLICITANTE",
      status: "ACTIVO",
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    form.reset({
      firstName: profileQuery.data.firstName ?? "",
      lastName: profileQuery.data.lastName ?? "",
      phone: profileQuery.data.phone ?? "",
      role: profileQuery.data.role,
      status: profileQuery.data.status,
    });
  }, [form, profileQuery.data]);

  if (profileQuery.isPending) return <PageSkeleton />;
  if (profileQuery.isError) {
    return (
      <PageContainer size="narrow">
        <PageHeader eyebrow="Administración" title="No pudimos abrir el usuario" />
        <ErrorState onRetry={() => profileQuery.refetch()} />
        <Link to="/admin/usuarios" className="btn mt-5">
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver a usuarios
        </Link>
      </PageContainer>
    );
  }

  const profile = profileQuery.data;
  const isSelf = currentUser?.id === profile.id;
  const displayName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
    || "Perfil sin completar";
  const localApiAvailable = localApi.isSuccess;

  const submit = (values: ManagedProfileForm) => {
    updateProfile.mutate({
      profileId: profile.id,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      role: values.role,
      status: values.status,
    });
  };

  const completeFromDni = () => {
    dniLookup.mutate(profile.dni, {
      onSuccess: (result) => {
        form.setValue("firstName", result.nombres, { shouldDirty: true, shouldValidate: true });
        form.setValue(
          "lastName",
          `${result.apellido_paterno} ${result.apellido_materno}`.trim(),
          { shouldDirty: true, shouldValidate: true },
        );
      },
    });
  };

  const confirmReset = () => {
    resetPassword.mutate(profile.id, {
      onSuccess: () => setConfirmingReset(false),
    });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={`DNI ${profile.dni}`}
        title={displayName}
        description="Actualiza los datos, el acceso y las credenciales temporales del usuario."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Usuarios", path: "/admin/usuarios" },
          { label: displayName },
        ]}
        actions={
          <Link to="/admin/usuarios" className="btn">
            <ArrowLeft className="size-4" aria-hidden="true" /> Volver
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <ProfileRoleBadge role={profile.role} />
        <ProfileStatusBadge status={profile.status} />
        {isSelf && <span className="badge badge-neutral">Tu cuenta</span>}
        {profile.mustChangePassword && (
          <span className="badge badge-warning">Contraseña temporal</span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <form
          className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7"
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          <div className="flex flex-col gap-3 border-b border-base-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black">Datos del usuario</h2>
              <p className="mt-1 text-sm text-base-content/60">
                El DNI identifica la cuenta y no puede modificarse.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!localApiAvailable || dniLookup.isPending}
              onClick={completeFromDni}
            >
              {dniLookup.isPending
                ? <span className="loading loading-spinner loading-sm" />
                : <DatabaseZap className="size-4" aria-hidden="true" />}
              Completar desde DNI
            </button>
          </div>

          <div className="mt-5 grid gap-x-4 sm:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nombres</legend>
              <label className={`input w-full ${form.formState.errors.firstName ? "input-error" : ""}`}>
                <UserRound className="size-4 opacity-45" aria-hidden="true" />
                <input {...form.register("firstName")} autoComplete="off" />
              </label>
              <FieldInfo id="managed-profile-first-name" error={form.formState.errors.firstName} />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Apellidos</legend>
              <label className={`input w-full ${form.formState.errors.lastName ? "input-error" : ""}`}>
                <UserRound className="size-4 opacity-45" aria-hidden="true" />
                <input {...form.register("lastName")} autoComplete="off" />
              </label>
              <FieldInfo id="managed-profile-last-name" error={form.formState.errors.lastName} />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Teléfono</legend>
              <label className={`input w-full ${form.formState.errors.phone ? "input-error" : ""}`}>
                <Phone className="size-4 opacity-45" aria-hidden="true" />
                <input {...form.register("phone")} type="tel" inputMode="tel" autoComplete="off" />
              </label>
              <FieldInfo id="managed-profile-phone" error={form.formState.errors.phone} />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">DNI</legend>
              <label className="input w-full">
                <IdCard className="size-4 opacity-45" aria-hidden="true" />
                <input value={profile.dni} readOnly aria-readonly="true" />
              </label>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Rol</legend>
              <select {...form.register("role")} className="select w-full" disabled={isSelf}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <FieldInfo id="managed-profile-role" error={form.formState.errors.role} />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Estado</legend>
              <select {...form.register("status")} className="select w-full" disabled={isSelf}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <FieldInfo id="managed-profile-status" error={form.formState.errors.status} />
            </fieldset>
          </div>

          {isSelf && (
            <div className="alert alert-info alert-soft mt-4 text-sm">
              <ShieldCheck className="size-5" aria-hidden="true" />
              Desde esta página puedes editar tus datos, pero no tu propio rol ni estado.
            </div>
          )}

          {updateProfile.isError && (
            <div role="alert" className="alert alert-error alert-soft mt-4">
              <AlertTriangle className="size-5" aria-hidden="true" />
              {getProfileMutationErrorMessage(updateProfile.error)}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button className="btn btn-primary" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <span className="loading loading-spinner loading-sm" />}
              Guardar cambios
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-black">
                  <Server className="size-5" aria-hidden="true" /> Servicio local
                </h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Herramientas disponibles en esta computadora.
                </p>
              </div>
              <span className={`status ${localApiAvailable ? "status-success" : "status-error"}`}>
                <span className="sr-only">
                  {localApiAvailable ? "Conectado" : "No disponible"}
                </span>
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold">
              {localApi.isPending
                ? "Verificando conexión..."
                : localApiAvailable
                  ? "Servidor conectado"
                  : "Servidor no disponible"}
            </p>
            <button
              type="button"
              className="btn btn-sm mt-4 w-full"
              disabled={localApi.isFetching}
              onClick={() => localApi.refetch()}
            >
              {localApi.isFetching
                ? <span className="loading loading-spinner loading-sm" />
                : <RefreshCw className="size-4" aria-hidden="true" />}
              Verificar conexión
            </button>
          </section>

          <section className="rounded-box border border-warning/35 bg-base-100 p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-black">
              <KeyRound className="size-5" aria-hidden="true" /> Contraseña temporal
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-base-content/65">
              Al restablecer, la contraseña será nuevamente el DNI <strong>{profile.dni}</strong>.
              El usuario deberá cambiarla cuanto antes desde su perfil.
            </p>

            {confirmingReset ? (
              <div role="alert" className="alert alert-warning alert-soft mt-4 items-start">
                <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">¿Confirmas el restablecimiento al DNI?</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={resetPassword.isPending}
                      onClick={() => setConfirmingReset(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      disabled={resetPassword.isPending}
                      onClick={confirmReset}
                    >
                      {resetPassword.isPending && <span className="loading loading-spinner loading-sm" />}
                      Sí, restablecer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-warning mt-5 w-full"
                disabled={!localApiAvailable}
                onClick={() => setConfirmingReset(true)}
              >
                <KeyRound className="size-4" aria-hidden="true" /> Restablecer al DNI
              </button>
            )}
          </section>
        </aside>
      </div>
    </PageContainer>
  );
};

export default AdminProfilePage;
