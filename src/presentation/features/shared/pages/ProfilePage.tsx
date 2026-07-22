import {
  useChangeOwnPassword,
  useUpdateOwnProfile,
} from "@/application/hooks/useProfiles";
import { useAuthStore } from "@/application/store/auth-store";
import FieldInfo from "@/presentation/components/FieldInfo";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import {
  changePasswordSchema,
  personalDataSchema,
  type ChangePasswordT,
  type PersonalDataT,
} from "@/presentation/features/shared/schemas/profile.schema";
import { NAVIGATION_BY_ROLE } from "@/presentation/navigation/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard, LockKeyhole, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateOwnProfile();
  const changePassword = useChangeOwnPassword();
  const personalForm = useForm<PersonalDataT>({
    resolver: zodResolver(personalDataSchema),
    values: {
      nombres: user?.name ?? "",
      apellidos: user?.lastName ?? "",
      telefono: user?.phone ?? "",
    },
  });
  const passwordForm = useForm<ChangePasswordT>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!user) return null;

  const roleLabel = NAVIGATION_BY_ROLE[user.role].shortLabel;
  const displayName = `${user.name} ${user.lastName}`.trim() || "Perfil sin completar";
  const initials = user.name && user.lastName
    ? `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";

  const submitPassword = (data: ChangePasswordT) => {
    if (data.password === user.dni) {
      passwordForm.setError("password", {
        message: "La nueva contraseña debe ser distinta de tu DNI",
      });
      return;
    }

    changePassword.mutate(data, {
      onSuccess: () => passwordForm.reset(),
    });
  };

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Mi cuenta"
        title="Perfil"
        description="Actualiza tus datos personales y protege tu cuenta."
      />

      <section className="mb-6 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-7">
          <span className="avatar avatar-placeholder">
            <span className="grid size-16 place-items-center rounded-2xl bg-neutral text-lg font-black text-neutral-content">
              {initials}
            </span>
          </span>
          <div className="min-w-0 grow">
            <h2 className="truncate text-xl font-black">{displayName}</h2>
            <p className="mt-1 text-sm text-base-content/60">DNI {user.dni}</p>
          </div>
          <span className="badge badge-success gap-2 py-3">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {roleLabel}
          </span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"
          onSubmit={personalForm.handleSubmit((data) => updateProfile.mutate(data))}
          noValidate
        >
          <h2 className="text-lg font-black">Datos personales</h2>
          <p className="mt-1 text-sm text-base-content/60">El DNI y el rol no pueden modificarse.</p>

          <fieldset className="fieldset mt-4">
            <legend className="fieldset-legend">Nombres</legend>
            <label className={`input w-full ${personalForm.formState.errors.nombres ? "input-error" : ""}`}>
              <UserRound className="size-4 opacity-45" aria-hidden="true" />
              <input {...personalForm.register("nombres")} autoComplete="given-name" />
            </label>
            <FieldInfo id="profile-name-error" error={personalForm.formState.errors.nombres} />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Apellidos</legend>
            <label className={`input w-full ${personalForm.formState.errors.apellidos ? "input-error" : ""}`}>
              <UserRound className="size-4 opacity-45" aria-hidden="true" />
              <input {...personalForm.register("apellidos")} autoComplete="family-name" />
            </label>
            <FieldInfo id="profile-last-name-error" error={personalForm.formState.errors.apellidos} />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Teléfono</legend>
            <label className={`input w-full ${personalForm.formState.errors.telefono ? "input-error" : ""}`}>
              <Phone className="size-4 opacity-45" aria-hidden="true" />
              <input {...personalForm.register("telefono")} type="tel" inputMode="tel" autoComplete="tel" />
            </label>
            <FieldInfo id="profile-phone-error" error={personalForm.formState.errors.telefono} />
          </fieldset>

          <div className="mt-4 flex items-center gap-2 text-xs text-base-content/55">
            <IdCard className="size-4" aria-hidden="true" /> DNI {user.dni}
          </div>
          <button className="btn btn-primary mt-5 w-full" disabled={updateProfile.isPending}>
            {updateProfile.isPending && <span className="loading loading-spinner loading-sm" />}
            Guardar datos
          </button>
        </form>

        <form
          className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6"
          onSubmit={passwordForm.handleSubmit(submitPassword)}
          noValidate
        >
          <h2 className="text-lg font-black">Contraseña</h2>
          <p className="mt-1 text-sm text-base-content/60">Usa una contraseña distinta de tu DNI.</p>

          <fieldset className="fieldset mt-4">
            <legend className="fieldset-legend">Nueva contraseña</legend>
            <label className={`input w-full ${passwordForm.formState.errors.password ? "input-error" : ""}`}>
              <LockKeyhole className="size-4 opacity-45" aria-hidden="true" />
              <input {...passwordForm.register("password")} type="password" autoComplete="new-password" />
            </label>
            <FieldInfo id="profile-password-error" error={passwordForm.formState.errors.password} />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Confirmar contraseña</legend>
            <label className={`input w-full ${passwordForm.formState.errors.confirmPassword ? "input-error" : ""}`}>
              <LockKeyhole className="size-4 opacity-45" aria-hidden="true" />
              <input {...passwordForm.register("confirmPassword")} type="password" autoComplete="new-password" />
            </label>
            <FieldInfo id="profile-confirm-password-error" error={passwordForm.formState.errors.confirmPassword} />
          </fieldset>

          {user.mustChangePassword && (
            <div role="alert" className="alert alert-warning alert-soft mt-4 text-sm">
              Tu cuenta todavía usa la contraseña temporal.
            </div>
          )}

          <button className="btn mt-5 w-full" disabled={changePassword.isPending}>
            {changePassword.isPending && <span className="loading loading-spinner loading-sm" />}
            Cambiar contraseña
          </button>
        </form>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
