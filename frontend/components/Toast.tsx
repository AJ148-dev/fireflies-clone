"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; tone: "ok" | "err" };

const ToastContext = createContext<(message: string, tone?: "ok" | "err") => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-6 bottom-20 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2.5 rounded-xl border border-white/10 border-l-4 bg-[#242428] px-4 py-3 text-sm text-white shadow-lg ${
              toast.tone === "err" ? "border-l-[#f87171]" : "border-l-[#22c55e]"
            }`}
          >
            <span aria-hidden="true" className={toast.tone === "err" ? "text-[#f87171]" : "text-[#86efac]"}>
              {toast.tone === "err" ? "!" : "✓"}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
