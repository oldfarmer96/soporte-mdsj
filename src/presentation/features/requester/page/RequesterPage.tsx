import RoleHomePage from "../../shared/pages/RoleHomePage";
import PendingConfirmations from "../components/PendingConfirmations";

const RequesterPage = () => (
  <RoleHomePage
    role="SOLICITANTE"
    description="Registra una incidencia y consulta el avance de tus solicitudes."
  >
    <PendingConfirmations />
  </RoleHomePage>
);
export default RequesterPage;
