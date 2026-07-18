import { useAuthStore } from "@/application/store/auth-store";
import ToggleTheme from "@/presentation/components/ToggleTheme";
import { roleBasedRedirection } from "@/shared/utils/roleBasedRedirection";
import { ArrowLeft, FileQuestion, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  const user = useAuthStore((state) => state.user);
  const destination = user ? roleBasedRedirection(user.role) : "/login";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-base-200 px-5 py-16 text-base-content">
      <div className="absolute right-4 top-4 rounded-box bg-base-100/80 shadow-sm backdrop-blur sm:right-6 sm:top-6">
        <ToggleTheme />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 text-[18rem] font-black leading-none text-primary/5 sm:text-[26rem]">
        404
      </div>

      <section className="relative w-full max-w-xl rounded-3xl border border-base-300 bg-base-100 p-8 text-center shadow-xl sm:p-12">
        <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary">
          <FileQuestion className="size-10" aria-hidden="true" />
        </span>
        <p className="mt-7 text-sm font-bold uppercase tracking-[0.25em] text-primary">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          Esta página no está disponible
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-base-content/60">
          Es posible que la dirección sea incorrecta o que la página haya sido
          movida.
        </p>

        <Link to={destination} replace className="btn btn-primary btn-lg mt-8">
          <ArrowLeft className="size-5" aria-hidden="true" />
          {user ? "Volver al inicio" : "Ir al acceso"}
        </Link>

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-base-300 pt-6 text-sm font-semibold text-base-content/50">
          <Headphones className="size-4" aria-hidden="true" />
          Mesa de soporte MDSJ
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
