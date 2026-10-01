import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatRelativeDate,
  formatRupiah,
  formatShortDate,
  formatSignedRupiah,
  todayISO,
} from "./format.ts";

const NBSP = " ";

test("formatRupiah uses id-ID grouping without decimals", () => {
  assert.equal(formatRupiah(1_234_000), `Rp${NBSP}1.234.000`);
  assert.equal(formatRupiah(0), `Rp${NBSP}0`);
});

test("formatSignedRupiah marks direction of the net", () => {
  assert.equal(formatSignedRupiah(250_000), `+Rp${NBSP}250.000`);
  assert.equal(formatSignedRupiah(-250_000), `−Rp${NBSP}250.000`);
  assert.equal(formatSignedRupiah(0), `Rp${NBSP}0`);
});

test("formatRelativeDate speaks casual Indonesian", () => {
  const now = new Date(2026, 9, 1, 23, 30); // late evening must not shift the day
  assert.equal(formatRelativeDate("2026-10-01", now), "hari ini");
  assert.equal(formatRelativeDate("2026-09-30", now), "kemarin");
  assert.equal(formatRelativeDate("2026-09-28", now), "3 hari lalu");
  assert.equal(formatRelativeDate("2026-09-17", now), "2 minggu lalu");
  assert.equal(formatRelativeDate("2026-07-01", now), "3 bulan lalu");
  assert.equal(formatRelativeDate("2024-10-01", now), "2 tahun lalu");
  assert.equal(formatRelativeDate("2026-10-02", now), "besok");
  assert.equal(formatRelativeDate("2026-10-05", now), "4 hari lagi");
});

test("date helpers stay on the local calendar day", () => {
  assert.equal(todayISO(new Date(2026, 0, 5, 0, 1)), "2026-01-05");
  assert.equal(formatShortDate("2026-10-01"), "1 Okt 2026");
});
