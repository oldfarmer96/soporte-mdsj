import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  title = "No pudimos cargar la información",
  description = "Ocurrió un problema inesperado. Revisa tu conexión e inténtalo nuevamente.",
  onRetry,
}: ErrorStateProps) => (
  <div className="alert alert-error alert-soft alert-vertical items-start sm:alert-horizontal">
    <AlertTriangle className="size-6 shrink-0" aria-hidden="true" />
    <div className="grow">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed">{description}</p>
    </div>
    {onRetry && (
      <button type="button" className="btn" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Reintentar
      </button>
    )}
  </div>
);

export default ErrorState;
