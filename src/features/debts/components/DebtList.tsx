import { formatRelativeDate, formatRupiah, formatShortDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import type { Debt, DebtType } from "../types";
import { DebtActions, type DebtActionHandlers } from "./DebtActions";

const TYPE_LABEL: Record<DebtType, string> = {
  owed_to_me: "Dihutang",
  i_owe: "Saya hutang",
};

function TypeDot({ type }: { type: DebtType }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0", type === "owed_to_me" ? "bg-ink" : "bg-accent")}
    />
  );
}

function StatusTag({ settled }: { settled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 px-2.5 py-0.75 text-[11px] tracking-[0.02em] whitespace-nowrap",
        settled ? "bg-neutral-100 text-neutral-800" : "bg-accent-100 text-accent-800",
      )}
    >
      {settled ? "Lunas" : "Belum lunas"}
    </span>
  );
}

type DebtListProps = DebtActionHandlers & {
  debts: Debt[];
  pendingIds: ReadonlySet<string>;
};

export function DebtList({ debts, pendingIds, ...handlers }: DebtListProps) {
  return (
    <>
      {/* Phone: stacked cards with thumb-sized actions. */}
      <ul className="md:hidden">
        {debts.map((debt) => {
          const settled = debt.settled_at !== null;
          return (
            <li
              key={debt.id}
              className={cn(
                "border-b border-divider py-3.5 transition-opacity duration-250",
                settled && "opacity-55",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="-translate-y-0.5">
                  <TypeDot type={debt.type} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                  {debt.counterpart_name}
                </span>
                <span className="font-extrabold whitespace-nowrap tabular-nums">
                  {formatRupiah(debt.amount)}
                </span>
              </div>
              <div className="mt-1.5 ml-4 flex items-center gap-1.5 text-xs text-neutral-700">
                <span>{TYPE_LABEL[debt.type]}</span>
                {debt.due_date && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={debt.due_date}>{formatRelativeDate(debt.due_date)}</time>
                  </>
                )}
                <span className="flex-1" />
                <StatusTag settled={settled} />
              </div>
              {debt.note && (
                <p className="mt-1 ml-4 text-xs break-words text-neutral-700">{debt.note}</p>
              )}
              <DebtActions
                debt={debt}
                pending={pendingIds.has(debt.id)}
                className="mt-2 ml-3"
                {...handlers}
              />
            </li>
          );
        })}
      </ul>

      {/* md+: table. */}
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b-2 border-divider text-left text-[11px] tracking-[0.08em] text-ink/60 uppercase">
            <th className="p-2 font-normal">Nama</th>
            <th className="p-2 font-normal">Tipe</th>
            <th className="p-2 text-right font-normal">Jumlah</th>
            <th className="p-2 font-normal">Tanggal</th>
            <th className="p-2 font-normal">Status</th>
            <th className="w-62.5 p-2 font-normal">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {debts.map((debt) => {
            const settled = debt.settled_at !== null;
            return (
              <tr
                key={debt.id}
                className={cn(
                  "border-b border-divider transition-opacity duration-250 hover:bg-ink/4",
                  settled && "opacity-55",
                )}
              >
                <td className="max-w-64 px-2 py-3.5">
                  <div className="truncate font-semibold">{debt.counterpart_name}</div>
                  {debt.note && (
                    <div className="truncate text-xs text-neutral-700" title={debt.note}>
                      {debt.note}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap">
                    <TypeDot type={debt.type} />
                    {TYPE_LABEL[debt.type]}
                  </span>
                </td>
                <td className="p-2 text-right font-semibold whitespace-nowrap tabular-nums">
                  {formatRupiah(debt.amount)}
                </td>
                <td className="p-2 text-[13px] whitespace-nowrap">
                  {debt.due_date ? (
                    <>
                      <time dateTime={debt.due_date}>{formatRelativeDate(debt.due_date)}</time>
                      <div className="text-[11px] text-neutral-600">
                        {formatShortDate(debt.due_date)}
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-2">
                  <StatusTag settled={settled} />
                </td>
                <td className="p-2">
                  <DebtActions debt={debt} pending={pendingIds.has(debt.id)} {...handlers} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
