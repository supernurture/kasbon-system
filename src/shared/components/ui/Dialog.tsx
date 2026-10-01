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
  /** Runs once the dialog has closed. */
  onClose: () => void;
  /** Esc / backdrop click ask to close; the owner decides (e.g. confirm unsaved changes). Defaults to onClose. */
  onRequestClose?: () => void;
  variant: keyof typeof variants;
  labelledBy: string;
  children: ReactNode;
};

/** Native <dialog>: focus trap and inert background come from the browser. */
export function Dialog({
  open,
  onClose,
  onRequestClose = onClose,
  variant,
  labelledBy,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first focusable element, overriding React's autoFocus.
      // Content marks a safer default with data-autofocus (e.g. "Gak jadi", not "Hapus").
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(event) => {
        // Esc: keep the dialog open and let the owner decide; `open` drives the actual close.
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose();
      }}
      className={cn("m-0 bg-bg p-0 text-ink shadow-lg", variants[variant])}
    >
      {open && children}
    </dialog>
  );
}
