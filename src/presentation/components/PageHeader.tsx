import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const PageHeader = ({
  title,
  description,
  eyebrow,
  actions,
  breadcrumbs,
}: PageHeaderProps) => (
  <header className="mb-6 sm:mb-8">
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav className="breadcrumbs mb-3 text-sm" aria-label="Migas de pan">
        <ul>
          {breadcrumbs.map((item) => (
            <li key={`${item.label}-${item.path ?? "current"}`}>
              {item.path ? <Link to={item.path}>{item.label}</Link> : item.label}
            </li>
          ))}
        </ul>
      </nav>
    )}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-sm font-bold text-primary">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  </header>
);

export default PageHeader;
