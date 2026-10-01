import assert from "node:assert/strict";
import { test } from "node:test";

import { computeSummary, groupByPerson } from "./summary.ts";

const SETTLED = "2026-10-01T10:00:00Z";

const debts = [
  { counterpart_name: "Budi", type: "owed_to_me", amount: 250_000, settled_at: null },
  { counterpart_name: " budi ", type: "owed_to_me", amount: 75_000, settled_at: null },
  { counterpart_name: "Budi", type: "owed_to_me", amount: 120_000, settled_at: SETTLED },
  { counterpart_name: "Sari", type: "i_owe", amount: 1_250_000, settled_at: null },
  { counterpart_name: "Kevin", type: "i_owe", amount: 350_000, settled_at: SETTLED },
] as const;

test("computeSummary only counts unsettled entries", () => {
  assert.deepEqual(computeSummary([...debts]), {
    owedToMe: 325_000,
    iOwe: 1_250_000,
    net: -925_000,
    owedToMeCount: 2,
    iOweCount: 1,
  });
});

test("computeSummary of nothing is zero", () => {
  assert.equal(computeSummary([]).net, 0);
});

test("groupByPerson merges names case/space-insensitively, biggest balance first", () => {
  const groups = groupByPerson([...debts]);
  assert.deepEqual(
    groups.map((g) => [g.name, g.entryCount, g.owedToMe, g.iOwe, g.net]),
    [
      ["Sari", 1, 0, 1_250_000, -1_250_000],
      ["Budi", 3, 325_000, 0, 325_000],
      ["Kevin", 1, 0, 0, 0],
    ],
  );
});
