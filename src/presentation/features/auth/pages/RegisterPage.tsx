import { useRegister } from "@/application/hooks/useAuth";
import FieldInfo from "@/presentation/components/FieldInfo";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, IdCard, Info } from "lucide-react";
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
          Ingresa tu DNI para crear una cuenta de solicitante.
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

        <div role="alert" className="alert alert-warning alert-soft text-sm">
          <Info className="size-5" aria-hidden="true" />
          <span>
            Tu contraseña inicial será tu DNI. Al ingresar, completa tu perfil y
            reemplázala por una contraseña segura.
          </span>
        </div>

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
