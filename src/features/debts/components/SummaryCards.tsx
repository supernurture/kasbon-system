import { formatRupiah, formatSignedRupiah } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import type { DebtSummary } from "../lib/summary";

const label = "text-[11px] font-normal text-neutral-700";
const totalLabel = `${label} md:tracking-[0.1em] md:uppercase`;
const netLabel = `${label} tracking-[0.1em] uppercase`;

function netCaption(net: number) {
  if (net > 0) return "Kamu lebih banyak dihutangin";
  if (net < 0) return "Kamu lebih banyak hutang";
  return "Impas!";
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="mt-2.5 h-1.5 bg-neutral-200 md:hidden" aria-hidden>
      <div
        className={cn("h-full transition-[width] duration-400", className)}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

/** Phone: Net on top, the two totals side by side below. md+: three columns, Net last. */
export function SummaryCards({ summary }: { summary: DebtSummary }) {
  const { owedToMe, iOwe, net, owedToMeCount, iOweCount } = summary;
  const max = Math.max(owedToMe, iOwe, 1);
  const netTone = net >= 0 ? "text-positive" : "text-accent-700";

  return (
    <section
      aria-label="Ringkasan"
      className="grid grid-cols-2 border-b-2 border-divider md:mx-8 md:mt-7 md:grid-cols-3 md:border-t-2 md:border-t-ink"
    >
      <div className="border-r-2 border-divider px-4 py-3.5 md:py-5 md:pr-6 md:pl-0">
        <h2 className={totalLabel}>Total dihutang ke saya</h2>
        <p className="mt-1 text-lg font-extrabold tabular-nums md:mt-2.5 md:text-[34px] md:leading-tight md:tracking-tight">
          {formatRupiah(owedToMe)}
        </p>
        <p className="mt-1.5 hidden text-xs text-neutral-700 md:block">
          {owedToMeCount} entry belum lunas
        </p>
        <Bar value={owedToMe} max={max} className="bg-ink" />
      </div>

      <div className="px-4 py-3.5 md:border-r-2 md:border-divider md:px-6 md:py-5">
        <h2 className={totalLabel}>Total saya hutang</h2>
        <p className="mt-1 text-lg font-extrabold tabular-nums md:mt-2.5 md:text-[34px] md:leading-tight md:tracking-tight">
          {formatRupiah(iOwe)}
        </p>
        <p className="mt-1.5 hidden text-xs text-neutral-700 md:block">
          {iOweCount} entry belum lunas
        </p>
        <Bar value={iOwe} max={max} className="bg-accent" />
      </div>

      <div
        className={cn(
          "order-first col-span-2 border-b-2 border-divider px-4 pt-4.5 pb-4 md:order-none md:col-span-1 md:border-b-0 md:px-6 md:py-5",
          net >= 0 ? "bg-positive-bg" : "bg-accent-100",
        )}
      >
        <h2 className={netLabel}>Net</h2>
        <p
          className={cn(
            "mt-1.5 text-4xl leading-tight font-extrabold tracking-tight tabular-nums md:mt-2.5 md:text-[34px]",
            netTone,
          )}
        >
          {formatSignedRupiah(net)}
        </p>
        <p className={cn("mt-1 text-xs font-semibold md:mt-1.5", netTone)}>{netCaption(net)}</p>
      </div>
    </section>
  );
}
