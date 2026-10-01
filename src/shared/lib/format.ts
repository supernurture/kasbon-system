const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plainNumber = new Intl.NumberFormat("id-ID");

const shortDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const longDate = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const DAY_MS = 86_400_000;

/** 1234000 → "Rp 1.234.000" (id-ID; the space is a non-breaking space so it never wraps). */
export function formatRupiah(amount: number) {
  return rupiah.format(amount);
}

/** Net values: "+Rp 1.000", "−Rp 1.000", "Rp 0". */
export function formatSignedRupiah(amount: number) {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return sign + formatRupiah(Math.abs(amount));
}

/** 1234000 → "1.234.000" (for the amount input). */
export function formatNumber(amount: number) {
  return plainNumber.format(amount);
}

/** "2026-10-01" → local-midnight Date. new Date("2026-10-01") would be UTC and shift a day west of GMT. */
function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "2026-09-28" on Oct 1 → "3 hari lalu". */
export function formatRelativeDate(value: string, now = new Date()) {
  const days = Math.round((startOfToday(now).getTime() - parseDateOnly(value).getTime()) / DAY_MS);

  if (days === 0) return "hari ini";
  if (days === 1) return "kemarin";
  if (days === -1) return "besok";
  if (days < 0) return `${-days} hari lagi`;
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}

/** "2026-10-01" → "1 Okt 2026". */
export function formatShortDate(value: string) {
  return shortDate.format(parseDateOnly(value));
}

/** → "Rabu, 1 Oktober". */
export function formatLongToday(now = new Date()) {
  return longDate.format(now);
}

/** Local calendar date as "YYYY-MM-DD" (what <input type="date"> expects). */
export function todayISO(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
