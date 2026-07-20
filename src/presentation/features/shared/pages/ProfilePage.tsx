import { useAuthStore } from "@/application/store/auth-store";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { NAVIGATION_BY_ROLE } from "@/presentation/navigation/navigation";
import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const roleLabel = NAVIGATION_BY_ROLE[user.role].shortLabel;
  const fields = [
    {
      label: "Nombre completo",
      value: `${user.name} ${user.lastName}`,
      icon: UserRound,
    },
    { label: "Correo institucional", value: user.email, icon: Mail },
    { label: "Teléfono", value: user.phone ?? "No registrado", icon: Phone },
    { label: "Rol", value: roleLabel, icon: ShieldCheck },
  ];

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Mi cuenta"
        title="Perfil"
        description="Consulta los datos vinculados a tu sesión."
      />

      <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-base-300 p-5 sm:flex-row sm:items-center sm:p-7">
          <span className="avatar avatar-placeholder">
            <span className="grid size-16 place-items-center rounded-2xl bg-neutral text-lg font-black text-neutral-content">
              {`${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
            </span>
          </span>
          <div className="min-w-0 grow">
            <h2 className="truncate text-xl font-black">
              {user.name} {user.lastName}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">DNI {user.dni}</p>
          </div>
          <span className="badge badge-success gap-2 py-3">
            <span className="status status-success" aria-hidden="true" />
            Sesión activa
          </span>
        </div>

        <dl className="grid gap-px bg-base-300 sm:grid-cols-2">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="min-w-0 bg-base-100 p-5 sm:p-6">
                <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-base-content/50">
                  <Icon className="size-4" aria-hidden="true" />
                  {field.label}
                </dt>
                <dd className="mt-2 break-words text-sm font-semibold sm:text-base">
                  {field.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </PageContainer>
  );
};

export default ProfilePage;
