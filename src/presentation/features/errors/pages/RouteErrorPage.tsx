import ErrorState from "@/presentation/components/ErrorState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { useRouteError } from "react-router-dom";

const RouteErrorPage = () => {
  const error = useRouteError();

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Error de página"
        title="Esta sección no respondió correctamente"
        description="El resto de tu sesión continúa disponible desde la navegación principal."
      />
      <ErrorState
        onRetry={() => window.location.reload()}
        description={
          error instanceof Error
            ? "La página encontró un error inesperado. Puedes recargarla para volver a intentarlo."
            : undefined
        }
      />
    </PageContainer>
  );
};

export default RouteErrorPage;
