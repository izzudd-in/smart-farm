"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (options: {
    type: ToastType;
    message: string;
    description?: string;
    duration?: number;
  }) => void;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, description?: string) => void;
    error: (message: string, description?: string) => void;
    info: (message: string, description?: string) => void;
  };
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type,
      message,
      description,
      duration = 3500,
    }: {
      type: ToastType;
      message: string;
      description?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: Toast = { id, type, message, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast],
  );

  const toast = {
    success: useCallback(
      (message: string, description?: string) => {
        showToast({ type: "success", message, description });
      },
      [showToast],
    ),
    error: useCallback(
      (message: string, description?: string) => {
        showToast({ type: "error", message, description });
      },
      [showToast],
    ),
    info: useCallback(
      (message: string, description?: string) => {
        showToast({ type: "info", message, description });
      },
      [showToast],
    ),
  };

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, dismissToast, toast }}
    >
      {children}
      <ToasterContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider so it never crashes
    return {
      toasts: [],
      showToast: () => {},
      dismissToast: () => {},
      toast: {
        success: (msg: string) => console.log("[Toast Success]", msg),
        error: (msg: string) => console.error("[Toast Error]", msg),
        info: (msg: string) => console.log("[Toast Info]", msg),
      },
    };
  }
  return context;
}

function ToasterContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-2 sm:p-0"
    >
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";

        const bgClass = isSuccess
          ? "bg-[#F0FDF4] border-[#86EFAC] text-[#166534]"
          : isError
            ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
            : "bg-[#F0F9FF] border-[#BAE6FD] text-[#075985]";

        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 ${bgClass}`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{t.message}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                    {t.description}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
