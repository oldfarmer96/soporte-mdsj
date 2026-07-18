import { useSupportDashboard } from "@/application/hooks/useDashboard";
import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import type {
  DashboardMetricItem,
  SupportDashboardMetrics,
} from "@/shared/interfaces/dashboard.interface";
import { getDashboardErrorMessage } from "@/services/dashboard.service";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileDown,
  Inbox,
  Sheet,
  TicketCheck,
  Tickets,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { Form, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  downloadDashboardExcel,
  downloadDashboardPdf,
} from "../utils/dashboardExports";

const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_CURSO: "En curso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
  REABIERTO: "Reabierto",
};
const PRIORITY_LABELS: Record<string, string> = {
  BAJO: "Baja",
  MEDIO: "Media",
  ALTO: "Alta",
  CRITICO: "Crítica",
};
const dateLabelFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const getLimaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const subtractDays = (date: string, days: number) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
};

const isDate = (value: string | null): value is string =>
  value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);

const MetricBars = ({
  title,
  items,
  labels,
}: {
  title: string;
  items: DashboardMetricItem[];
  labels?: Record<string, string>;
}) => {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 rounded-box bg-base-200 p-4 text-sm text-base-content/60">
          Sin datos en el periodo seleccionado.
        </p>
      ) : (
        <dl className="mt-5 grid gap-4">
          {items.map((item) => (
            <div key={item.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <dt className="truncate font-semibold">{labels?.[item.key] ?? item.key}</dt>
                <dd className="font-black">{item.count}</dd>
              </div>
              <progress
                className="progress w-full"
                value={item.count}
                max={max}
                aria-label={`${labels?.[item.key] ?? item.key}: ${item.count}`}
              />
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

const SummaryCards = ({ metrics }: { metrics: SupportDashboardMetrics }) => {
  const cards = [
    { label: "Creados en el periodo", value: metrics.summary.created, icon: Tickets },
    { label: "Resueltos en el periodo", value: metrics.summary.resolved, icon: TicketCheck },
    { label: "Activos actualmente", value: metrics.summary.active, icon: Activity },
    { label: "Sin asignar", value: metrics.summary.unassigned, icon: Inbox },
    {
      label: "Promedio para asignar",
      value: `${metrics.summary.avgAssignmentHours} h`,
      icon: Clock3,
    },
    {
      label: "Promedio para resolver",
      value: `${metrics.summary.avgResolutionHours} h`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="stats border border-base-300 bg-base-100 shadow-sm">
            <div className="stat min-w-0">
              <div className="stat-figure text-base-content/45">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <div className="stat-title whitespace-normal text-sm">{card.label}</div>
              <div className="stat-value text-2xl sm:text-3xl">{card.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DashboardPage = ({ role }: { role: "APOYO" | "ADMIN" }) => {
  const [searchParams] = useSearchParams();
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const today = getLimaToday();
  const fromParam = searchParams.get("desde");
  const toParam = searchParams.get("hasta");
  const range = {
    from: isDate(fromParam) ? fromParam : subtractDays(today, 29),
    to: isDate(toParam) ? toParam : today,
  };
  const rangeDays = Math.floor(
    (new Date(`${range.to}T00:00:00Z`).getTime() -
      new Date(`${range.from}T00:00:00Z`).getTime()) /
      86_400_000,
  );
  const isRangeValid = rangeDays >= 0 && rangeDays <= 365;
  const metricsQuery = useSupportDashboard(range, isRangeValid);
  const dailyMax = metricsQuery.data
    ? Math.max(
        1,
        ...metricsQuery.data.daily.map((item) => Math.max(item.created, item.resolved)),
      )
    : 1;

  const exportReport = async (format: "pdf" | "xlsx") => {
    if (!metricsQuery.data) return;
    setExporting(format);
    try {
      if (format === "pdf") await downloadDashboardPdf(metricsQuery.data);
      else await downloadDashboardExcel(metricsQuery.data);
      toast.success(`Reporte ${format.toUpperCase()} generado correctamente`);
    } catch {
      toast.error("No pudimos generar el reporte. Inténtalo nuevamente.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={role === "ADMIN" ? "Administración" : "Personal de apoyo"}
        title="Resumen operativo"
        description="Indicadores agregados de la mesa de soporte en horario de Lima."
        actions={
          metricsQuery.isSuccess ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn"
                disabled={exporting !== null}
                onClick={() => exportReport("pdf")}
              >
                {exporting === "pdf" ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FileDown className="size-4" aria-hidden="true" />
                )}
                PDF
              </button>
              <button
                type="button"
                className="btn"
                disabled={exporting !== null}
                onClick={() => exportReport("xlsx")}
              >
                {exporting === "xlsx" ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Sheet className="size-4" aria-hidden="true" />
                )}
                Excel
              </button>
            </div>
          ) : undefined
        }
      />

      <Form
        key={searchParams.toString()}
        method="get"
        className="mb-5 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm sm:flex sm:items-end sm:gap-3 sm:p-5"
        aria-label="Periodo del dashboard"
      >
        <fieldset className="fieldset grow">
          <legend className="fieldset-legend">Desde</legend>
          <input type="date" name="desde" className="input w-full" defaultValue={range.from} />
        </fieldset>
        <fieldset className="fieldset grow">
          <legend className="fieldset-legend">Hasta</legend>
          <input type="date" name="hasta" className="input w-full" defaultValue={range.to} />
        </fieldset>
        <button type="submit" className="btn mt-3 sm:mt-0">
          <CalendarDays className="size-4" aria-hidden="true" /> Actualizar periodo
        </button>
      </Form>

      {!isRangeValid && (
        <ErrorState
          title="Rango de fechas no válido"
          description="Selecciona una fecha inicial anterior a la final y un periodo máximo de 366 días."
        />
      )}
      {metricsQuery.isPending && isRangeValid && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status">
          <span className="sr-only">Cargando métricas...</span>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="skeleton h-32 w-full" />
          ))}
        </div>
      )}
      {metricsQuery.isError && (
        <ErrorState
          description={getDashboardErrorMessage(metricsQuery.error)}
          onRetry={() => metricsQuery.refetch()}
        />
      )}
      {metricsQuery.isSuccess && (
        <div className="space-y-5">
          <SummaryCards metrics={metricsQuery.data} />

          <div className="grid gap-5 xl:grid-cols-2">
            <MetricBars
              title="Tickets por estado"
              items={metricsQuery.data.byStatus}
              labels={STATUS_LABELS}
            />
            <MetricBars
              title="Tickets por prioridad"
              items={metricsQuery.data.byPriority}
              labels={PRIORITY_LABELS}
            />
            <MetricBars title="Áreas con más tickets" items={metricsQuery.data.byArea} />
            <MetricBars
              title="Categorías con más tickets"
              items={metricsQuery.data.byCategory}
            />
          </div>

          <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black">Tendencia diaria</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Últimos {Math.min(31, metricsQuery.data.daily.length)} días del rango.
                </p>
              </div>
              <div className="mt-2 flex gap-4 text-xs font-semibold sm:mt-0">
                <span className="flex items-center gap-1.5"><span className="status status-info" /> Creados</span>
                <span className="flex items-center gap-1.5"><span className="status status-success" /> Resueltos</span>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {metricsQuery.data.daily.slice(-31).map((day) => {
                return (
                  <div key={day.date} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-xs">
                    <time dateTime={day.date} className="font-semibold">
                      {dateLabelFormatter.format(new Date(`${day.date}T00:00:00Z`))}
                    </time>
                    <div className="grid gap-1">
                      <progress className="progress progress-info h-2 w-full" value={day.created} max={dailyMax} aria-label={`${day.date}: ${day.created} creados`} />
                      <progress className="progress progress-success h-2 w-full" value={day.resolved} max={dailyMax} aria-label={`${day.date}: ${day.resolved} resueltos`} />
                    </div>
                    <span className="text-right font-bold">{day.created}/{day.resolved}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <UsersRound className="mt-0.5 size-5" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-black">Carga actual de apoyo</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  Tickets asignados, en curso o reabiertos por persona.
                </p>
              </div>
            </div>
            {metricsQuery.data.workload.length === 0 ? (
              <p className="mt-5 rounded-box bg-base-200 p-4 text-sm text-base-content/60">
                No hay carga asignada actualmente.
              </p>
            ) : (
              <div className="mt-5 overflow-hidden rounded-box border border-base-300">
                <table className="table">
                  <thead><tr><th>Personal</th><th>Asignados</th><th>En curso</th></tr></thead>
                  <tbody>
                    {metricsQuery.data.workload.map((item) => (
                      <tr key={item.agent}>
                        <td className="font-semibold">{item.agent}</td>
                        <td>{item.assigned}</td>
                        <td>{item.inProgress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
