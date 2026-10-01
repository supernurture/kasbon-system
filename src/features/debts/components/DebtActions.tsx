import { Check, Loader2, Pencil, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/cn";
import type { Debt } from "../types";

export type DebtActionHandlers = {
  onToggleSettled: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
};

type DebtActionsProps = DebtActionHandlers & {
  debt: Debt;
  pending: boolean;
  className?: string;
};

export function DebtActions({
  debt,
  pending,
  onToggleSettled,
  onEdit,
  onDelete,
  className,
}: DebtActionsProps) {
  const settled = debt.settled_at !== null;
  const name = debt.counterpart_name;

  return (
    <div className={cn("flex items-center gap-1 md:gap-0.5", className)}>
      <Button
        variant={settled ? "plain" : "secondary"}
        disabled={pending}
        onClick={() => onToggleSettled(debt)}
        className={cn(
          "min-h-10 flex-1 text-[13px] md:min-h-9 md:w-31 md:flex-none md:px-2.5",
          settled && "font-semibold text-neutral-700",
        )}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : settled ? (
          <Undo2 size={14} aria-hidden />
        ) : (
          <Check size={14} strokeWidth={2.6} aria-hidden />
        )}
        {settled ? (
          <>
            Batalin<span className="md:hidden"> lunas</span>
          </>
        ) : (
          "Tandai lunas"
        )}
      </Button>
      <Button
        iconOnly
        onClick={() => onEdit(debt)}
        aria-label={`Edit catatan ${name}`}
        className="min-h-10 md:min-h-9 md:w-9 md:border-transparent md:hover:bg-ink/7"
      >
        <Pencil size={16} aria-hidden />
      </Button>
      <Button
        iconOnly
        onClick={() => onDelete(debt)}
        aria-label={`Hapus catatan ${name}`}
        className="min-h-10 text-accent md:min-h-9 md:w-9 md:border-transparent md:hover:bg-accent/10"
      >
        <Trash2 size={16} aria-hidden />
      </Button>
    </div>
  );
}
