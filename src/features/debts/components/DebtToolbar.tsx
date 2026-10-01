import { Select } from "@/shared/components/ui/Select";
import { debtQuerySchema, type DebtQuery } from "../schemas";

const { status: statusSchema, type: typeSchema } = debtQuerySchema.shape;

type DebtToolbarProps = {
  query: DebtQuery;
  onChange: (patch: Partial<DebtQuery>) => void;
};

export function DebtToolbar({ query, onChange }: DebtToolbarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4 pt-3.5 pb-1 md:mx-8 md:mt-6 md:flex md:flex-wrap md:items-end md:gap-3 md:p-0">
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
    </div>
  );
}
