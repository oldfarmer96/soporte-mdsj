import { useRequesterTicketsRealtime } from "@/application/hooks/useTicketRealtime";
import { useAuthStore } from "@/application/store/auth-store";
import { NAVIGATION_BY_ROLE } from "../navigation/navigation";
import AppLayout from "./AppLayout";

const RequesterLayout = () => {
  const requesterId = useAuthStore((state) => state.user?.id);
  useRequesterTicketsRealtime(requesterId);

  return <AppLayout navigation={NAVIGATION_BY_ROLE.SOLICITANTE} />;
};

export default RequesterLayout;
