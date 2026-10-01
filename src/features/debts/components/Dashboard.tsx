"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/shared/components/ui/Button";
import { Toast } from "@/shared/components/ui/Toast";
import { useToast } from "@/shared/hooks/useToast";
import { formatLongToday } from "@/shared/lib/format";
import { toSearchParams } from "../api";
import { useDebtMutations } from "../hooks/useDebtMutations";
import { useDebts } from "../hooks/useDebts";
import { computeSummary } from "../lib/summary";
import { debtQuerySchema, type DebtQuery } from "../schemas";
import type { Debt } from "../types";
import { DebtFormDialog } from "./DebtFormDialog";
import { DebtList } from "./DebtList";
import { DebtToolbar } from "./DebtToolbar";
import { DeleteDialog } from "./DeleteDialog";
import { EmptyState, ErrorState, ListSkeleton, NoResults } from "./ListStates";
import { SummaryCards } from "./SummaryCards";

const DEFAULT_QUERY = debtQuerySchema.parse({});

const noopSubscribe = () => () => {};

export function Dashboard() {
  const [query, setQuery] = useState<DebtQuery>(DEFAULT_QUERY);
  const [formTarget, setFormTarget] = useState<Debt | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const { toast, show } = useToast();

  // Today's date in the viewer's timezone; empty during SSR so server and client markup agree.
  const today = useSyncExternalStore(noopSubscribe, formatLongToday, () => "");

  // Summary always covers every entry; the list follows the filters. With no filters the
  // list reuses the summary request instead of fetching the same thing twice.
  const listParams = toSearchParams(query);
  const all = useDebts("");
  const filtered = useDebts(listParams === "" ? null : listParams);
  const list = listParams === "" ? all : filtered;

  const reloadAll = all.reload;
  const reloadFiltered = filtered.reload;
  const reload = useCallback(() => {
    reloadAll();
    reloadFiltered();
  }, [reloadAll, reloadFiltered]);

  const { pendingIds, toggleSettled, remove, save } = useDebtMutations({
    onChanged: reload,
    notify: show,
  });

  const summary = useMemo(() => computeSummary(all.debts ?? []), [all.debts]);
  const openCreate = () => setFormTarget("new");
  const hasNoDebts = all.debts?.length === 0;

  function renderList() {
    const error = all.error ?? list.error;
    if (error) return <ErrorState message={error} onRetry={reload} />;
    if (!list.debts) return <ListSkeleton />;
    if (hasNoDebts) return <EmptyState onCreate={openCreate} />;
    if (list.debts.length === 0) return <NoResults onReset={() => setQuery(DEFAULT_QUERY)} />;
    return (
      <div className={list.isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <DebtList
          debts={list.debts}
          pendingIds={pendingIds}
          onToggleSettled={toggleSettled}
          onEdit={setFormTarget}
          onDelete={setDeleteTarget}
        />
      </div>
    );
  }

  return (
    <main className="flex-1 pb-28 md:pb-10">
      <div className="hidden items-end gap-6 px-8 pt-8 md:flex">
        <div className="flex-1">
          <p className="mb-1.5 min-h-4 text-[11px] tracking-[0.1em] text-accent-700 uppercase">
            {today}
          </p>
          <h1 className="text-5xl tracking-[-0.03em]">Catatan utang piutang</h1>
        </div>
        <Button variant="primary" onClick={openCreate} className="min-h-12 min-w-50 text-[15px]">
          <Plus size={18} strokeWidth={2.4} aria-hidden />
          Catat baru
        </Button>
      </div>
      <h1 className="sr-only md:hidden">Catatan utang piutang</h1>

      <div
        aria-busy={!all.debts && !all.error}
        className={!all.debts && !all.error ? "animate-pulse" : undefined}
      >
        <SummaryCards summary={summary} />
      </div>

      {!hasNoDebts && (
        <DebtToolbar query={query} onChange={(p) => setQuery((q) => ({ ...q, ...p }))} />
      )}

      <section aria-label="Daftar catatan" className="px-4 pt-2 md:px-8 md:pt-5">
        {renderList()}
      </section>

      {/* Phone: primary action pinned to the thumb zone. */}
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink bg-bg px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
        <Button variant="primary" onClick={openCreate} className="min-h-13 w-full text-base">
          <Plus size={20} strokeWidth={2.4} aria-hidden />
          Catat baru
        </Button>
      </div>

      <DebtFormDialog target={formTarget} onClose={() => setFormTarget(null)} onSave={save} />
      <DeleteDialog
        debt={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async (debt) => {
          // Close either way: on failure the error toast must not hide behind the dialog.
          await remove(debt);
          setDeleteTarget(null);
        }}
      />
      <Toast toast={toast} />
    </main>
  );
}
