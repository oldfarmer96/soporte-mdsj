import { useAuthSession } from "@/application/hooks/useAuthSession";

const AuthSessionManager = () => {
  useAuthSession();
  return null;
};

export default AuthSessionManager;
