export type Theme = "dark" | "light" | "system";

function createThemeStore() {
  const stored = typeof localStorage !== "undefined"
    ? (localStorage.getItem("theme") as Theme | null)
    : null;

  let current = $state<Theme>(stored ?? "dark");

  return {
    get current() {
      return current;
    },
    set(theme: Theme) {
      current = theme;
      localStorage.setItem("theme", theme);
    },
  };
}

export const themeStore = createThemeStore();
