"use client";

import { useEffect, useState } from "react";

import { applyTheme, readTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    window.addEventListener("ff-theme", sync);
    return () => window.removeEventListener("ff-theme", sync);
  }, []);

  function toggle() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      aria-pressed={theme === "dark"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className="rounded-md border border-ff-strong px-2 py-1 text-xs font-medium text-ff-text-secondary hover-ff"
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
