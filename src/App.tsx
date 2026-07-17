import { RouterProvider } from "react-router-dom";
import { routes } from "./presentation/routes/routes";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./infrastructure/config/tanstack-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import AuthSessionManager from "./presentation/components/AuthSessionManager";

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionManager />
      <RouterProvider router={routes} />
      <Toaster richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
