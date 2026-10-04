"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { debtsApi, SessionExpiredError } from "../api";
import { applyPatches, type OptimisticPatch } from "../lib/optimistic";
import type { DebtInput } from "../schemas";
import type { Debt } from "../types";

type Notify = (message: string, tone?: "success" | "error") => void;

/** Resolves to null on success, or the error message on failure. */
type MutationResult = Promise<string | null>;

type MutationOptions = { toastError?: boolean; optimistic?: OptimisticPatch };

/**
 * Every write goes through the API and then refetches, so the screen ends up mirroring the DB.
 * Settle and delete are optimistic: the patch shows immediately, is dropped on failure (instant
 * rollback) and is only removed on success once the refetched data already reflects the change.
 */
export function useDebtMutations({
  onChanged,
  notify,
}: {
  onChanged: () => Promise<void>;
  notify: Notify;
}) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [patches, setPatches] = useState<ReadonlyMap<string, OptimisticPatch>>(new Map());

  const setPatch = useCallback((id: string, patch: OptimisticPatch | null) => {
    setPatches((current) => {
      const next = new Map(current);
      if (patch) next.set(id, patch);
      else next.delete(id);
      return next;
    });
  }, []);

  const track = useCallback(
    async (
      id: string,
      run: () => Promise<unknown>,
      success: string,
      { toastError = true, optimistic }: MutationOptions = {},
    ): MutationResult => {
      setPendingIds((ids) => new Set(ids).add(id));
      if (optimistic) setPatch(id, optimistic);
      try {
        await run();
        notify(success);
        const refreshed = onChanged();
        // Keep the optimistic patch until the fresh data has landed, so nothing flickers back.
        if (optimistic) await refreshed;
        return null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (error instanceof SessionExpiredError) {
          router.replace("/login");
          return message;
        }
        if (toastError) notify(message, "error");
        return message;
      } finally {
        if (optimistic) setPatch(id, null);
        setPendingIds((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
      }
    },
    [notify, onChanged, router, setPatch],
  );

  const toggleSettled = useCallback(
    (debt: Debt) => {
      const settle = debt.settled_at === null;
      return track(
        debt.id,
        () => debtsApi.update(debt.id, { settled: settle }),
        settle ? "Sip, ditandai lunas." : "Status balik ke belum lunas.",
        { optimistic: { kind: "settle", settledAt: settle ? new Date().toISOString() : null } },
      );
    },
    [track],
  );

  const remove = useCallback(
    (debt: Debt) =>
      track(debt.id, () => debtsApi.remove(debt.id), "Catatan dihapus.", {
        optimistic: { kind: "delete" },
      }),
    [track],
  );

  // The form waits for the server (it shows validation errors inline, and a toast would sit
  // behind the open dialog), so create/edit are not optimistic.
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

  const withOptimistic = useCallback(
    (debts: Debt[] | undefined) => applyPatches(debts, patches),
    [patches],
  );

  return { pendingIds, toggleSettled, remove, save, withOptimistic };
}
