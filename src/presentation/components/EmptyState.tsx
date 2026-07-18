import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

const EmptyState = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) => (
  <section className="rounded-box border border-dashed border-base-300 bg-base-100 px-5 py-12 text-center sm:px-8 sm:py-16">
    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-base-200 text-base-content/65">
      <Icon className="size-7" aria-hidden="true" />
    </span>
    <h2 className="mt-5 text-lg font-black sm:text-xl">{title}</h2>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-base-content/65 sm:text-base">
      {description}
    </p>
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </section>
);

export default EmptyState;
