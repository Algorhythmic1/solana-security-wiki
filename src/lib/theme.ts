export const THEME_STORAGE_KEY = "solana-security-wiki-theme";

export type Theme = "dark" | "light";

/** OS preference only; site default is light (see getInitialTheme). */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* private mode */
  }
  return null;
}

/** Used before React hydrates; keep in sync with inline script in index.html */
export function getInitialTheme(): Theme {
  return readStoredTheme() ?? "light";
}

export function themeColorMeta(theme: Theme): string {
  return theme === "dark" ? "#0c0d10" : "#f4f5f9";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeColorMeta(theme));
  }
}

export function getThemeFromDocument(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" ? "light" : "dark";
}
