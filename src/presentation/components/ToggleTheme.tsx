import { Check, ChevronDown, Palette } from "lucide-react";
import { useState } from "react";

const themes = [
  { value: "cupcake", label: "Cupcake" },
  { value: "dark", label: "Dark" },
  { value: "nord", label: "Nord" },
  { value: "night", label: "Night" },
  { value: "valentine", label: "Valentine" },
] as const;

type Theme = (typeof themes)[number]["value"];

const isTheme = (value: string | null): value is Theme =>
  themes.some((theme) => theme.value === value);

const getInitialTheme = (): Theme => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  return isTheme(currentTheme) ? currentTheme : "cupcake";
};

const ToggleTheme = () => {
  const [activeTheme, setActiveTheme] = useState<Theme>(getInitialTheme);

  const changeTheme = (theme: Theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    setActiveTheme(theme);

    try {
      localStorage.setItem("app-theme", theme);
    } catch {
      // ww
    }
  };

  return (
    <details className="dropdown dropdown-end">
      <summary
        className="btn btn-ghost gap-2"
        aria-label={`Cambiar tema. Tema actual: ${activeTheme}`}
      >
        <Palette className="size-5" aria-hidden="true" />
        <span className="hidden sm:inline">Tema</span>
        <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
      </summary>

      <ul className="menu dropdown-content z-50 mt-2 w-52 rounded-box border border-base-300 bg-base-100 p-2 text-base-content shadow-xl">
        {themes.map((theme) => (
          <li key={theme.value}>
            <button
              type="button"
              className={
                activeTheme === theme.value ? "menu-active" : undefined
              }
              onClick={(event) => {
                changeTheme(theme.value);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              aria-pressed={activeTheme === theme.value}
            >
              <span className="grow">{theme.label}</span>
              {activeTheme === theme.value && (
                <Check className="size-4" aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
};

export default ToggleTheme;
