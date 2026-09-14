"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = 'info' | 'success' | 'warning' | 'danger';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col space-y-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "relative flex items-start space-x-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-xl transition-all animate-in slide-in-from-bottom-5",
              t.type === 'success' && "border-l-4 border-l-[var(--success)]",
              t.type === 'warning' && "border-l-4 border-l-[var(--warning)]",
              t.type === 'danger' && "border-l-4 border-l-[var(--danger)]",
              t.type === 'info' && "border-l-4 border-l-[var(--accent)]"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {t.type === 'danger' && <XCircle className="h-5 w-5 text-rose-400" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
            </div>
            <div className="flex-1 space-y-0.5 pr-2">
              {t.title && (
                <h4 className="text-sm font-semibold text-[var(--foreground)]">
                  {t.title}
                </h4>
              )}
              <p className="text-sm text-[var(--muted-foreground)]">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--subtle-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
