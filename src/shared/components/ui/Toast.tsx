import { AlertCircle, Check } from "lucide-react";

import type { ToastState } from "@/shared/hooks/useToast";
import { cn } from "@/shared/lib/cn";

export function Toast({ toast }: { toast: ToastState }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center md:inset-x-auto md:bottom-6 md:left-8"
    >
      {toast && (
        <div
          key={toast.id}
          className={cn(
            "flex animate-[toast-in_.2s_ease-out] items-center gap-2.5 px-4 py-3 text-sm shadow-lg",
            toast.tone === "success" ? "bg-ink text-bg" : "bg-accent-700 text-bg",
          )}
        >
          {toast.tone === "success" ? (
            <Check size={16} strokeWidth={2.6} aria-hidden />
          ) : (
            <AlertCircle size={16} aria-hidden />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
