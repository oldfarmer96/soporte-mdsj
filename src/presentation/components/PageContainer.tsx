import type { PropsWithChildren } from "react";

interface PageContainerProps extends PropsWithChildren {
  size?: "default" | "narrow";
}

const PageContainer = ({ children, size = "default" }: PageContainerProps) => (
  <div
    className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 ${
      size === "narrow" ? "max-w-4xl" : "max-w-[100rem]"
    }`}
  >
    {children}
  </div>
);

export default PageContainer;
