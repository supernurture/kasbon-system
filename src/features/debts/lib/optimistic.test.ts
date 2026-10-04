import assert from "node:assert/strict";
import { test } from "node:test";

import { applyPatches, type OptimisticPatch } from "./optimistic.ts";

const debts = [
  { id: "a", settled_at: null },
  { id: "b", settled_at: "2026-10-01T10:00:00Z" },
  { id: "c", settled_at: null },
];

test("no patches returns the server data untouched", () => {
  assert.equal(applyPatches(debts, new Map()), debts);
  assert.equal(applyPatches(undefined, new Map([["a", { kind: "delete" }]])), undefined);
});

test("settle, unsettle and delete patches are applied on top of server data", () => {
  const patches = new Map<string, OptimisticPatch>([
    ["a", { kind: "settle", settledAt: "2026-10-04T08:00:00Z" }],
    ["b", { kind: "settle", settledAt: null }],
    ["c", { kind: "delete" }],
  ]);
  assert.deepEqual(applyPatches(debts, patches), [
    { id: "a", settled_at: "2026-10-04T08:00:00Z" },
    { id: "b", settled_at: null },
  ]);
  // the original array is never mutated
  assert.equal(debts.length, 3);
  assert.equal(debts[0].settled_at, null);
});

test("patches for rows that are not in the list are ignored", () => {
  assert.deepEqual(applyPatches(debts, new Map([["zzz", { kind: "delete" }]])), debts);
});
