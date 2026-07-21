import { useProfiles } from "@/application/hooks/useProfiles";
import CollapsibleFilters from "@/presentation/components/CollapsibleFilters";
import EmptyState from "@/presentation/components/EmptyState";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import type { ProfileStatus } from "@/shared/interfaces/profile.interface";
import type { RoleT } from "@/shared/types/role.types";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Form, Link, useSearchParams } from "react-router-dom";
import { ProfileRoleBadge, ProfileStatusBadge } from "../components/ProfileBadges";
import ProfileAccessDialog from "../components/ProfileAccessDialog";

const PAGE_SIZE = 20;
const ROLES: RoleT[] = ["SOLICITANTE", "APOYO", "ADMIN"];
const STATUSES: ProfileStatus[] = ["ACTIVO", "INACTIVO", "BLOQUEADO"];
const ROLE_LABELS: Record<RoleT, string> = {
  SOLICITANTE: "Solicitante",
  APOYO: "Personal de apoyo",
  ADMIN: "Administrador",
};
const STATUS_LABELS: Record<ProfileStatus, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  BLOQUEADO: "Bloqueado",
};
const dateFormatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });

const isRole = (value: string | null): value is RoleT =>
  value !== null && ROLES.includes(value as RoleT);
const isStatus = (value: string | null): value is ProfileStatus =>
  value !== null && STATUSES.includes(value as ProfileStatus);

const ProfilesPage = () => {
  const [searchParams] = useSearchParams();
  const pageValue = Number(searchParams.get("pagina"));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const roleValue = searchParams.get("rol");
  const statusValue = searchParams.get("estado");
  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: searchParams.get("q")?.trim() || undefined,
    role: isRole(roleValue) ? roleValue : undefined,
    status: isStatus(statusValue) ? statusValue : undefined,
  };
  const profilesQuery = useProfiles(filters);
  const activeFilterCount = [filters.search, filters.role, filters.status].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;
  const isPageOutOfRange =
    profilesQuery.isSuccess &&
    profilesQuery.data.total > 0 &&
    page > profilesQuery.data.totalPages;

  const pageUrl = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete("pagina");
    else params.set("pagina", String(nextPage));
    const query = params.toString();
    return query ? `?${query}` : "/admin/usuarios";
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Consulta perfiles y administra sus roles y estados de acceso."
        breadcrumbs={[
          { label: "Administración", path: "/admin" },
          { label: "Usuarios" },
        ]}
      />

      <Form
        key={searchParams.toString()}
        method="get"
        aria-label="Filtros de usuarios"
      >
        <CollapsibleFilters activeCount={activeFilterCount} title="Buscar y filtrar">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_14rem]">
          <fieldset className="fieldset sm:col-span-2 lg:col-span-1">
            <legend className="fieldset-legend">DNI, nombres o apellidos</legend>
            <label className="input w-full">
              <Search className="size-4 opacity-45" aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={filters.search}
                maxLength={100}
                placeholder="Buscar usuario"
              />
            </label>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Rol</legend>
            <select name="rol" className="select w-full" defaultValue={filters.role ?? ""}>
              <option value="">Todos los roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Estado</legend>
            <select
              name="estado"
              className="select w-full"
              defaultValue={filters.status ?? ""}
            >
              <option value="">Todos los estados</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </fieldset>
          </div>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {hasFilters && (
              <Link to="/admin/usuarios" className="btn btn-ghost">
                <X className="size-4" aria-hidden="true" /> Limpiar
              </Link>
            )}
            <button type="submit" className="btn">
              <Filter className="size-4" aria-hidden="true" /> Aplicar filtros
            </button>
          </div>
        </CollapsibleFilters>
      </Form>

      {profilesQuery.isPending && (
        <div className="grid gap-3" role="status">
          <span className="sr-only">Cargando usuarios...</span>
          {[0, 1, 2].map((item) => <div key={item} className="skeleton h-44 w-full" />)}
        </div>
      )}
      {profilesQuery.isError && <ErrorState onRetry={() => profilesQuery.refetch()} />}
      {profilesQuery.isSuccess && profilesQuery.data.items.length === 0 && (
        <EmptyState
          icon={UsersRound}
          title={isPageOutOfRange ? "Esta página ya no está disponible" : "No encontramos usuarios"}
          description={
            isPageOutOfRange
              ? "Vuelve a la primera página para continuar consultando el directorio."
              : hasFilters
                ? "Prueba con otro DNI, nombre, rol o estado."
                : "No existen perfiles visibles para tu cuenta."
          }
          action={
            isPageOutOfRange ? (
              <Link to={pageUrl(1)} className="btn">Primera página</Link>
            ) : hasFilters ? (
              <Link to="/admin/usuarios" className="btn">Limpiar filtros</Link>
            ) : undefined
          }
        />
      )}
      {profilesQuery.isSuccess && profilesQuery.data.items.length > 0 && (
        <section
          className={profilesQuery.isPlaceholderData ? "opacity-60" : undefined}
          aria-busy={profilesQuery.isPlaceholderData}
          aria-labelledby="profile-results-title"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="profile-results-title" className="text-sm font-black">
              {profilesQuery.data.total} usuarios encontrados
            </h2>
            <p className="text-xs text-base-content/55">
              Página {page} de {profilesQuery.data.totalPages}
            </p>
          </div>

          <ul className="grid gap-3 lg:hidden" aria-label="Usuarios registrados">
            {profilesQuery.data.items.map((profile) => (
              <li key={profile.id} className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="avatar avatar-placeholder">
                    <span className="grid size-11 place-items-center rounded-xl bg-neutral font-black text-neutral-content">
                      {`${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()}
                    </span>
                  </span>
                  <div className="min-w-0 grow">
                    <h3 className="font-black">{profile.firstName} {profile.lastName}</h3>
                    <p className="mt-1 text-sm text-base-content/55">DNI {profile.dni}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ProfileRoleBadge role={profile.role} />
                  <ProfileStatusBadge status={profile.status} />
                </div>
                <dl className="mt-4 grid gap-2 border-t border-base-300 pt-4 text-sm text-base-content/65">
                  <div className="flex items-center gap-2">
                    <Phone className="size-4" aria-hidden="true" />
                    <dt className="sr-only">Teléfono</dt>
                    <dd>{profile.phone ?? "Sin teléfono"}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    <dt className="sr-only">Fecha de registro</dt>
                    <dd>Registrado {dateFormatter.format(new Date(profile.createdAt))}</dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-base-300 pt-4">
                  <ProfileAccessDialog profile={profile} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm lg:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                   <th>Registrado</th>
                   <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {profilesQuery.data.items.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <span className="flex items-center gap-2 font-black">
                        <UserRound className="size-4" aria-hidden="true" />
                        {profile.firstName} {profile.lastName}
                      </span>
                    </td>
                    <td>{profile.dni}</td>
                    <td>{profile.phone ?? "Sin teléfono"}</td>
                    <td><ProfileRoleBadge role={profile.role} /></td>
                    <td><ProfileStatusBadge status={profile.status} /></td>
                    <td><time dateTime={profile.createdAt}>{dateFormatter.format(new Date(profile.createdAt))}</time></td>
                    <td><ProfileAccessDialog profile={profile} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Paginación">
            {page > 1 ? (
              <Link to={pageUrl(page - 1)} className="btn">
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : (
              <button type="button" className="btn" disabled>
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}
            <span className="text-sm font-semibold">{page} / {profilesQuery.data.totalPages}</span>
            {page < profilesQuery.data.totalPages ? (
              <Link to={pageUrl(page + 1)} className="btn">
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" className="btn" disabled>
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </nav>
        </section>
      )}
    </PageContainer>
  );
};

export default ProfilesPage;
