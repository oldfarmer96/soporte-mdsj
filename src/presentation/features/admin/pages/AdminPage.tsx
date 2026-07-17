import { useAuthStore } from "@/application/store/auth-store";
import { ShieldCheck } from "lucide-react";

const AdminPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Administración</p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            Hola, {user?.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/60 sm:text-base">
            El acceso administrativo está protegido. Aquí se incorporarán los
            módulos de usuarios y catálogos.
          </p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-base-200">
          <ShieldCheck className="size-7" aria-hidden="true" />
        </span>
      </div>
    </section>
  );
};

export default AdminPage;
