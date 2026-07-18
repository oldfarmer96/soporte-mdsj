import { NAVIGATION_BY_ROLE } from "../navigation/navigation";
import AppLayout from "./AppLayout";

const AdminLayout = () => {
  return <AppLayout navigation={NAVIGATION_BY_ROLE.ADMIN} />;
};
export default AdminLayout;
