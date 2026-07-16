import { useLogin } from "@/application/hooks/useAuth";
import FieldInfo from "@/presentation/components/FieldInfo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, IdCard, LockKeyhole, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { loginSchema, type LoginT } from "../schemas/login.schema";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginT>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      dni: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginT) => {
    login.mutate(data);
  };

  return (
    <div className="rounded-3xl border border-base-300 bg-base-100 p-6 shadow-xl shadow-base-300/30 sm:p-9 mx-6 lg:mx-auto lg:max-w-5/12 mt-6">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">
          Bienvenido
        </p>
        <h2 className="text-3xl font-black">Inicia sesión</h2>
        <p className="mt-2 text-sm leading-relaxed text-base-content/60">
          Usa tu DNI y contraseña para ingresar a la mesa de soporte.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset className="fieldset">
          <label className="label font-semibold" htmlFor="dni">
            DNI
          </label>
          <label
            className={`input input-lg w-full ${errors.dni ? "input-error" : ""}`}
          >
            <IdCard className="size-5 opacity-45" aria-hidden="true" />
            <input
              id="dni"
              {...register("dni")}
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="Ingresa tus 8 dígitos"
            />
          </label>
          <FieldInfo id="dni-error" error={errors.dni} />
        </fieldset>

        <fieldset className="fieldset">
          <label className="label font-semibold" htmlFor="password">
            Contraseña
          </label>
          <label
            className={`input input-lg w-full ${errors.password ? "input-error" : ""}`}
          >
            <LockKeyhole className="size-5 opacity-45" aria-hidden="true" />
            <input
              id="password"
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              className="grow"
            />
            <button
              type="button"
              className="btn btn-circle btn-ghost btn-xs"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Ver contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </label>
          <FieldInfo id="password-error" error={errors.password} />
        </fieldset>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={login.isPending}
        >
          {login.isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <LogIn className="size-5" aria-hidden="true" />
          )}
          {login.isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-base-content/60">
        ¿Aún no tienes una cuenta?{" "}
        <Link className="link link-primary font-bold" to="/register">
          Regístrate
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
