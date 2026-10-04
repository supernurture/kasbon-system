import type { Debt } from "../types";

/** A change shown on screen before the server has confirmed it. */
export type OptimisticPatch = { kind: "delete" } | { kind: "settle"; settledAt: string | null };

/** Server data with the pending patches laid on top. Returns the same array when nothing applies. */
export function applyPatches<T extends Pick<Debt, "id" | "settled_at">>(
  debts: T[] | undefined,
  patches: ReadonlyMap<string, OptimisticPatch>,
): T[] | undefined {
  if (!debts || patches.size === 0) return debts;

  const result: T[] = [];
  for (const debt of debts) {
    const patch = patches.get(debt.id);
    if (!patch) result.push(debt);
    else if (patch.kind === "settle") result.push({ ...debt, settled_at: patch.settledAt });
    // kind "delete": leave it out
  }
  return result;
}
