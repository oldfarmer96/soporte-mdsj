import type { TicketResolution } from "@/shared/interfaces/ticket.interface";
import { CheckCircle2, Clock3, Wrench } from "lucide-react";

const TicketResolutionPanel = ({
  resolution,
}: {
  resolution: TicketResolution | null;
}) => (
  <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-7">
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-base-200">
        <Wrench className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-lg font-black">Resolución</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Diagnóstico y solución informados por el personal de apoyo.
        </p>
      </div>
    </div>

    {!resolution ? (
      <div className="mt-5 flex items-start gap-3 rounded-box bg-base-200 p-4 text-sm text-base-content/65">
        <Clock3 className="size-5 shrink-0" aria-hidden="true" />
        <p>El ticket todavía no tiene una solución registrada.</p>
      </div>
    ) : (
      <div className="mt-5 space-y-5">
        {resolution.diagnosis && (
          <div>
            <h3 className="text-sm font-black">Diagnóstico</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70">
              {resolution.diagnosis}
            </p>
          </div>
        )}
        <div>
          <h3 className="text-sm font-black">Solución</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70">
            {resolution.solution}
          </p>
        </div>
        {resolution.requesterConfirmed === true && (
          <div className="alert alert-success alert-soft">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            <span>Confirmaste que la solución resolvió el problema.</span>
          </div>
        )}
        {resolution.requesterConfirmed === false && (
          <div className="alert alert-warning alert-soft items-start">
            <Clock3 className="size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">La solución fue rechazada</p>
              {resolution.requesterComment && (
                <p className="mt-1 text-sm">{resolution.requesterComment}</p>
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </section>
);

export default TicketResolutionPanel;
