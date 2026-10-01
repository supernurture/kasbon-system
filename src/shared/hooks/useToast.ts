"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastState = { message: string; tone: "success" | "error"; id: number } | null;

export function useToast(durationMs = 2500) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(
    (message: string, tone: "success" | "error" = "success") => {
      clearTimeout(timer.current);
      setToast({ message, tone, id: Date.now() });
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, show };
}
