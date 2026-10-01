"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Dialog } from "@/shared/components/ui/Dialog";
import { formatRupiah } from "@/shared/lib/format";
import type { Debt } from "../types";

type DeleteDialogProps = {
  debt: Debt | null;
  onCancel: () => void;
  onConfirm: (debt: Debt) => Promise<void>;
};

export function DeleteDialog({ debt, onCancel, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    if (!debt) return;
    setDeleting(true);
    try {
      await onConfirm(debt);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={debt !== null} onClose={onCancel} variant="alert" labelledBy="delete-title">
      {debt && (
        <div className="flex flex-col gap-2.5 px-4 py-5 md:gap-3 md:p-4">
          <h2 id="delete-title" className="text-xl">
            Hapus catatan ini?
          </h2>
          <p className="text-[13px] break-words text-neutral-800 md:text-sm">
            {debt.counterpart_name} · {formatRupiah(debt.amount)}. Ini gak bisa di-undo.
          </p>
          <div className="mt-1 flex flex-col gap-2 md:mt-2 md:flex-row-reverse">
            <Button
              variant="primary"
              onClick={confirm}
              disabled={deleting}
              className="min-h-12 md:min-h-11"
            >
              {deleting && <Loader2 size={16} className="animate-spin" aria-hidden />}
              Hapus
            </Button>
            <Button
              onClick={onCancel}
              disabled={deleting}
              className="min-h-12 md:min-h-11"
              data-autofocus
            >
              Gak jadi
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
