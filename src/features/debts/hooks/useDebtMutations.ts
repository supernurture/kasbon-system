"use client";

import { useCallback, useState } from "react";

import { debtsApi } from "../api";
import type { DebtInput } from "../schemas";
import type { Debt } from "../types";

type Notify = (message: string, tone?: "success" | "error") => void;

/** Resolves to null on success, or the error message on failure. */
type MutationResult = Promise<string | null>;

/** Every write goes through the API, then `onChanged` refetches, so the screen always mirrors the DB. */
export function useDebtMutations({ onChanged, notify }: { onChanged: () => void; notify: Notify }) {
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const track = useCallback(
    async (
      id: string,
      run: () => Promise<unknown>,
      success: string,
      { toastError = true } = {},
    ): MutationResult => {
      setPendingIds((ids) => new Set(ids).add(id));
      try {
        await run();
        notify(success);
        onChanged();
        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (toastError) notify(message, "error");
        return message;
      } finally {
        setPendingIds((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
      }
    },
    [notify, onChanged],
  );

  const toggleSettled = useCallback(
    (debt: Debt) => {
      const settle = debt.settled_at === null;
      return track(
        debt.id,
        () => debtsApi.update(debt.id, { settled: settle }),
        settle ? "Sip, ditandai lunas." : "Status balik ke belum lunas.",
      );
    },
    [track],
  );

  const remove = useCallback(
    (debt: Debt) => track(debt.id, () => debtsApi.remove(debt.id), "Catatan dihapus."),
    [track],
  );

  // The form shows its own error inline (a toast would sit behind the open dialog).
  const save = useCallback(
    (input: DebtInput, existing: Debt | null) =>
      existing
        ? track(existing.id, () => debtsApi.update(existing.id, input), "Perubahan kesimpen.", {
            toastError: false,
          })
        : track("new", () => debtsApi.create(input), "Catatan baru kesimpen.", {
            toastError: false,
          }),
    [track],
  );

  return { pendingIds, toggleSettled, remove, save };
}
