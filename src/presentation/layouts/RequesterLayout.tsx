import { NAVIGATION_BY_ROLE } from "../navigation/navigation";
import AppLayout from "./AppLayout";

const RequesterLayout = () => {
  return <AppLayout navigation={NAVIGATION_BY_ROLE.SOLICITANTE} />;
};

export default RequesterLayout;
