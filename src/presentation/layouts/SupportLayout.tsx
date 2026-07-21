import SupportRealtimeControls from "../features/support/components/SupportRealtimeControls";
import { NAVIGATION_BY_ROLE } from "../navigation/navigation";
import AppLayout from "./AppLayout";

const SupportLayout = () => {
  return (
    <AppLayout
      navigation={NAVIGATION_BY_ROLE.APOYO}
      headerTools={<SupportRealtimeControls />}
    />
  );
};
export default SupportLayout;
