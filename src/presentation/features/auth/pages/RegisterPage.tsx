import { useRegister } from "@/application/hooks/useAuth";
import FieldInfo from "@/presentation/components/FieldInfo";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, IdCard, LockKeyhole, Phone, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { registerSchema, type RegisterT } from "../schemas/register.schema";

const RegisterPage = () => {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterT>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      dni: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterT) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl shadow-base-300/30 sm:p-9 mx-6 lg:mx-auto lg:max-w-7/12 mt-6">
      <Link to="/login" className="btn btn-ghost btn-sm -ml-2 mb-5 gap-2">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver
      </Link>

      <div className="mb-6">
        <h2 className="text-3xl font-black">Regístrate</h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/60">
          Completa tus datos para solicitar soporte técnico.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset className="fieldset">
          <label className="label font-semibold" htmlFor="dni">
            DNI
          </label>
          <label className={`input w-full ${errors.dni ? "input-error" : ""}`}>
            <IdCard className="size-5 opacity-45" aria-hidden="true" />
            <input
              id="dni"
              {...register("dni")}
              type="text"
              inputMode="numeric"
              autoComplete="username"
              aria-invalid={Boolean(errors.dni)}
              aria-describedby={errors.dni ? "dni-error" : undefined}
              maxLength={8}
              placeholder="12345678"
            />
          </label>
          <FieldInfo id="dni-error" error={errors.dni} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="fieldset">
            <label className="label font-semibold" htmlFor="nombres">
              Nombres
            </label>
            <label
              className={`input w-full ${errors.nombres ? "input-error" : ""}`}
            >
              <UserRound className="size-4 opacity-45" aria-hidden="true" />
              <input
                id="nombres"
                {...register("nombres")}
                type="text"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.nombres)}
                aria-describedby={errors.nombres ? "nombres-error" : undefined}
                placeholder="Nombres"
              />
            </label>
            <FieldInfo id="nombres-error" error={errors.nombres} />
          </fieldset>

          <fieldset className="fieldset">
            <label className="label font-semibold" htmlFor="apellidos">
              Apellidos
            </label>
            <label
              className={`input w-full ${errors.apellidos ? "input-error" : ""}`}
            >
              <UserRound className="size-4 opacity-45" aria-hidden="true" />
              <input
                id="apellidos"
                {...register("apellidos")}
                type="text"
                autoComplete="family-name"
                aria-invalid={Boolean(errors.apellidos)}
                aria-describedby={errors.apellidos ? "apellidos-error" : undefined}
                placeholder="Apellidos"
              />
            </label>
            <FieldInfo id="apellidos-error" error={errors.apellidos} />
          </fieldset>
        </div>

        <fieldset className="fieldset">
          <label className="label font-semibold" htmlFor="telefono">
            Teléfono <span className="font-normal opacity-50">(opcional)</span>
          </label>
          <label
            className={`input w-full ${errors.telefono ? "input-error" : ""}`}
          >
            <Phone className="size-5 opacity-45" aria-hidden="true" />
            <input
              id="telefono"
              {...register("telefono")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.telefono)}
              aria-describedby={errors.telefono ? "telefono-error" : undefined}
              maxLength={15}
              placeholder="987654321"
            />
          </label>
          <FieldInfo id="telefono-error" error={errors.telefono} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="fieldset">
            <label className="label font-semibold" htmlFor="password">
              Contraseña
            </label>
            <label
              className={`input w-full ${errors.password ? "input-error" : ""}`}
            >
              <LockKeyhole className="size-4 opacity-45" aria-hidden="true" />
              <input
                id="password"
                {...register("password")}
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "register-password-error" : undefined}
                placeholder="Mínimo 8 caracteres"
              />
            </label>
            <FieldInfo id="register-password-error" error={errors.password} />
          </fieldset>

          <fieldset className="fieldset">
            <label className="label font-semibold" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <label
              className={`input w-full ${errors.confirmPassword ? "input-error" : ""}`}
            >
              <LockKeyhole className="size-4 opacity-45" aria-hidden="true" />
              <input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                placeholder="Repite tu contraseña"
              />
            </label>
            <FieldInfo
              id="confirm-password-error"
              error={errors.confirmPassword}
            />
          </fieldset>
        </div>

        <p className="text-xs leading-relaxed text-base-content/60">
          Guarda esta contraseña en un lugar seguro. Esta aplicación no tendrá
          recuperación automática por correo.
        </p>

        <button
          type="submit"
          className="btn btn-primary btn-lg mt-2 w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending && (
            <span className="loading loading-spinner loading-sm" />
          )}
          {registerMutation.isPending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
