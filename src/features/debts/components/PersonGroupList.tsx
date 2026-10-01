import { cn } from "@/shared/lib/cn";
import { formatRupiah, formatSignedRupiah } from "@/shared/lib/format";
import type { PersonGroup } from "../lib/summary";

const netTone = (net: number) =>
  net > 0 ? "text-positive" : net < 0 ? "text-accent-700" : "text-neutral-700";

const amountOrDash = (amount: number) => (amount ? formatRupiah(amount) : "—");

export function PersonGroupList({ groups }: { groups: PersonGroup[] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-divider text-left text-[11px] tracking-[0.08em] text-ink/60 uppercase">
          <th className="py-2 pr-2 font-normal md:px-2">Orang</th>
          <th className="hidden p-2 font-normal md:table-cell">Entry</th>
          <th className="hidden p-2 text-right font-normal md:table-cell">Dihutang ke saya</th>
          <th className="hidden p-2 text-right font-normal md:table-cell">Saya hutang</th>
          <th className="py-2 pl-2 text-right font-normal md:px-2">Net belum lunas</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <tr key={group.key} className="border-b border-divider hover:bg-ink/4">
            <td className="max-w-0 py-3.5 pr-2 md:max-w-64 md:px-2">
              <div className="truncate font-semibold">{group.name}</div>
              <div className="text-xs text-neutral-700 md:hidden">{group.entryCount} entry</div>
            </td>
            <td className="hidden p-2 text-[13px] md:table-cell">{group.entryCount} entry</td>
            <td className="hidden p-2 text-right tabular-nums md:table-cell">
              {amountOrDash(group.owedToMe)}
            </td>
            <td className="hidden p-2 text-right tabular-nums md:table-cell">
              {amountOrDash(group.iOwe)}
            </td>
            <td
              className={cn(
                "py-3.5 pl-2 text-right font-extrabold whitespace-nowrap tabular-nums md:px-2",
                netTone(group.net),
              )}
            >
              {formatSignedRupiah(group.net)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
