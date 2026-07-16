import { Headphones } from "lucide-react";
import { Suspense, type PropsWithChildren } from "react";

const PageFallback = () => (
  <div className="grid min-h-screen place-items-center bg-base-200 px-6 text-base-content">
    <div className="flex flex-col items-center gap-5" role="status">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-content shadow-lg">
        <Headphones className="size-7" aria-hidden="true" />
      </span>
      <span className="loading loading-dots loading-lg text-primary" />
      <p className="text-sm font-semibold text-base-content/60">
        Cargando página...
      </p>
    </div>
  </div>
);

const LazyPageSuspense = ({ children }: PropsWithChildren) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
);

export default LazyPageSuspense;
