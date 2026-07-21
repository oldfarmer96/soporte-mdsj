import { useAuthStore } from "@/application/store/auth-store";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { NAVIGATION_BY_ROLE } from "@/presentation/navigation/navigation";
import type { RoleT } from "@/shared/types/role.types";
import { ArrowRight, UserRoundPen } from "lucide-react";
import { Link } from "react-router-dom";

interface RoleHomePageProps {
  role: RoleT;
  description: string;
}

const RoleHomePage = ({ role, description }: RoleHomePageProps) => {
  const user = useAuthStore((state) => state.user);
  const navigation = NAVIGATION_BY_ROLE[role];
  const destinations = navigation.items.filter(
    (item) => item.path !== navigation.homePath && item.path !== navigation.profilePath,
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={navigation.shortLabel}
        title={`Hola, ${user?.name ?? "bienvenido"}`}
        description={description}
      />

      {role === "SOLICITANTE" &&
        (!user?.name ||
          !user.lastName ||
          !user.phone ||
          user.mustChangePassword) && (
          <div role="alert" className="alert alert-warning alert-soft mb-6 sm:alert-horizontal">
            <UserRoundPen className="size-5" aria-hidden="true" />
            <div className="grow">
              <h2 className="font-bold">Completa tu perfil</h2>
              <p className="text-sm">
                Registra tus datos personales y cambia tu contraseña temporal.
              </p>
            </div>
            <Link className="btn btn-sm" to={navigation.profilePath}>
              Ir a mi perfil
            </Link>
          </div>
        )}

      <section aria-labelledby="quick-access-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="quick-access-title" className="text-lg font-black">
            Accesos principales
          </h2>
          <span className="text-xs font-semibold text-base-content/50">
            {destinations.length} secciones
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {destinations.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex min-h-36 flex-col rounded-box border p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  index === 0
                    ? "border-primary/25 bg-primary text-primary-content"
                    : "border-base-300 bg-base-100 hover:bg-base-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid size-10 place-items-center rounded-xl ${
                      index === 0 ? "bg-primary-content/15" : "bg-base-200"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="size-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-5 font-black">{item.label}</h3>
                <p
                  className={`mt-1 text-sm leading-relaxed ${
                    index === 0 ? "text-primary-content/75" : "text-base-content/60"
                  }`}
                >
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
};

export default RoleHomePage;
