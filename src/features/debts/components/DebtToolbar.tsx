import { Search } from "lucide-react";

import { Input } from "@/shared/components/ui/Input";
import { SegmentedControl } from "@/shared/components/ui/SegmentedControl";
import { Select } from "@/shared/components/ui/Select";
import { debtQuerySchema, MAX_NAME_LENGTH, type DebtQuery } from "../schemas";

const { status: statusSchema, type: typeSchema } = debtQuerySchema.shape;

export type DebtView = "list" | "group";

const SORT_OPTIONS = [
  { value: "date", label: "Terbaru" },
  { value: "amount", label: "Jumlah" },
] as const;

const VIEW_OPTIONS = [
  { value: "list", label: "Per entry" },
  { value: "group", label: "Per orang" },
] as const;

type DebtToolbarProps = {
  query: DebtQuery;
  search: string;
  view: DebtView;
  onChange: (patch: Partial<DebtQuery>) => void;
  onSearch: (value: string) => void;
  onViewChange: (view: DebtView) => void;
};

export function DebtToolbar({
  query,
  search,
  view,
  onChange,
  onSearch,
  onViewChange,
}: DebtToolbarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 pt-3.5 pb-1 md:mx-8 md:mt-6 md:flex md:flex-wrap md:items-end md:gap-3 md:p-0">
      <label className="col-span-2 md:min-w-55 md:flex-1">
        <span className="mb-1.5 hidden text-xs text-ink/70 md:block">Cari nama</span>
        <span className="relative block">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-600"
          />
          <Input
            type="search"
            aria-label="Cari nama"
            placeholder="Budi, Sari…"
            maxLength={MAX_NAME_LENGTH}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </span>
      </label>
      <label className="md:w-40">
        <span className="mb-1.5 hidden text-xs text-ink/70 md:block">Status</span>
        <Select
          aria-label="Filter status"
          value={query.status}
          onChange={(e) => onChange({ status: statusSchema.parse(e.target.value) })}
        >
          <option value="all">Semua status</option>
          <option value="open">Belum lunas</option>
          <option value="settled">Lunas</option>
        </Select>
      </label>
      <label className="md:w-40">
        <span className="mb-1.5 hidden text-xs text-ink/70 md:block">Tipe</span>
        <Select
          aria-label="Filter tipe"
          value={query.type}
          onChange={(e) => onChange({ type: typeSchema.parse(e.target.value) })}
        >
          <option value="all">Semua tipe</option>
          <option value="owed_to_me">Dihutang</option>
          <option value="i_owe">Saya hutang</option>
        </Select>
      </label>
      <SegmentedControl
        name="sort"
        label="Urutkan"
        value={query.sort}
        options={SORT_OPTIONS}
        onChange={(sort) => onChange({ sort })}
      />
      <SegmentedControl
        name="view"
        label="Tampilan"
        value={view}
        options={VIEW_OPTIONS}
        onChange={onViewChange}
      />
    </div>
  );
}
