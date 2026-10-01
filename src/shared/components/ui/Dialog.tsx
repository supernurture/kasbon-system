"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

const variants = {
  // Full screen on phones, right-hand drawer from md up.
  drawer:
    "inset-0 h-dvh max-h-none w-full max-w-none md:left-auto md:w-[460px] md:border-l-2 md:border-ink",
  // Bottom sheet on phones, centred card from md up.
  alert:
    "inset-x-0 top-auto bottom-0 w-full max-w-none border-t-4 border-accent md:inset-0 md:m-auto md:h-fit md:w-[440px]",
} as const;

type DialogProps = {
  open: boolean;
  onClose: () => void;
  variant: keyof typeof variants;
  labelledBy: string;
  children: ReactNode;
};

/** Native <dialog>: focus trap, Esc to close and inert background come from the browser. */
export function Dialog({ open, onClose, variant, labelledBy, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn("m-0 bg-bg p-0 text-ink shadow-lg", variants[variant])}
    >
      {open && children}
    </dialog>
  );
}
