import type { Database } from "@/shared/lib/supabase/database.types";

export type { DebtType } from "@/shared/lib/supabase/database.types";

export type Debt = Omit<Database["public"]["Tables"]["debts"]["Row"], "user_id">;

export const DEBT_COLUMNS =
  "id, type, counterpart_name, amount, note, due_date, settled_at, created_at, updated_at";
