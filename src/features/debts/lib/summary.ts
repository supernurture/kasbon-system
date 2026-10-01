import type { Debt } from "../types";

type SummarySource = Pick<Debt, "type" | "amount" | "settled_at">;

export type DebtSummary = {
  owedToMe: number;
  iOwe: number;
  net: number;
  owedToMeCount: number;
  iOweCount: number;
};

/** Totals over unsettled entries only: a paid debt no longer counts toward what's owed. */
export function computeSummary(debts: SummarySource[]): DebtSummary {
  const summary: DebtSummary = { owedToMe: 0, iOwe: 0, net: 0, owedToMeCount: 0, iOweCount: 0 };

  for (const debt of debts) {
    if (debt.settled_at !== null) continue;
    if (debt.type === "owed_to_me") {
      summary.owedToMe += debt.amount;
      summary.owedToMeCount += 1;
    } else {
      summary.iOwe += debt.amount;
      summary.iOweCount += 1;
    }
  }

  summary.net = summary.owedToMe - summary.iOwe;
  return summary;
}

export type PersonGroup = {
  key: string;
  name: string;
  entryCount: number;
  owedToMe: number;
  iOwe: number;
  net: number;
};

/** "Budi" and " budi " are the same person: 3 entry, total Rp X. Biggest open balance first. */
export function groupByPerson(
  debts: Array<SummarySource & Pick<Debt, "counterpart_name">>,
): PersonGroup[] {
  const groups = new Map<string, PersonGroup>();

  for (const debt of debts) {
    const key = debt.counterpart_name.trim().toLocaleLowerCase("id-ID");
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        name: debt.counterpart_name.trim(),
        entryCount: 0,
        owedToMe: 0,
        iOwe: 0,
        net: 0,
      };
      groups.set(key, group);
    }

    group.entryCount += 1;
    if (debt.settled_at !== null) continue;
    if (debt.type === "owed_to_me") group.owedToMe += debt.amount;
    else group.iOwe += debt.amount;
  }

  return [...groups.values()]
    .map((group) => ({ ...group, net: group.owedToMe - group.iOwe }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name, "id-ID"));
}
