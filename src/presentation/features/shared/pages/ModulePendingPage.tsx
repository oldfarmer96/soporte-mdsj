import EmptyState from "@/presentation/components/EmptyState";
import PageContainer from "@/presentation/components/PageContainer";
import PageHeader from "@/presentation/components/PageHeader";
import { Construction, type LucideIcon } from "lucide-react";

interface ModulePendingPageProps {
  title: string;
  description: string;
  section: string;
  icon?: LucideIcon;
}

const ModulePendingPage = ({
  title,
  description,
  section,
  icon = Construction,
}: ModulePendingPageProps) => (
  <PageContainer>
    <PageHeader title={title} description={description} eyebrow={section} />
    <EmptyState
      icon={icon}
      title="La navegación ya está preparada"
      description="Esta sección se completará en su módulo de negocio correspondiente. Por ahora no se muestran datos ficticios ni acciones que todavía no están conectadas."
    />
  </PageContainer>
);

export default ModulePendingPage;
