import { formatRupiah } from "@/shared/lib/format";
import type { DebtSummary } from "../lib/summary";

/** md+ only: phones get the mini bars inside SummaryCards instead. */
export function BalanceChart({ summary }: { summary: DebtSummary }) {
  const max = Math.max(summary.owedToMe, summary.iOwe, 1);
  const rows = [
    { label: "Dihutang ke saya", value: summary.owedToMe, bar: "bg-ink" },
    { label: "Saya hutang", value: summary.iOwe, bar: "bg-accent" },
  ];

  return (
    <figure className="mx-8 hidden grid-cols-[160px_minmax(0,1fr)] items-center gap-y-2.5 border-b-2 border-divider py-4.5 text-xs md:grid">
      <figcaption className="sr-only">
        Perbandingan total dihutang dan hutang yang belum lunas
      </figcaption>
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <span className="text-neutral-700">{row.label}</span>
          <div
            role="img"
            aria-label={`${row.label}: ${formatRupiah(row.value)}`}
            className="h-3.5 bg-neutral-200"
          >
            <div
              className={`h-full transition-[width] duration-400 ${row.bar}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </figure>
  );
}
