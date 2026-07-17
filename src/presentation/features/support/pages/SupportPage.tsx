import { useAuthStore } from "@/application/store/auth-store";
import { Wrench } from "lucide-react";

const SupportPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Personal de apoyo</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            Hola, {user?.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/60 sm:text-base">
            El acceso por rol funciona. Aquí construiremos la cola y la atención
            de tickets.
          </p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-base-200">
          <Wrench className="size-7" aria-hidden="true" />
        </span>
      </div>
    </section>
  );
};

export default SupportPage;
