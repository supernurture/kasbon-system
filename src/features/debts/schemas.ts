import { z } from "zod";

export const DEBT_TYPES = ["owed_to_me", "i_owe"] as const;
export const DEBT_STATUSES = ["open", "settled"] as const;
export const DEBT_SORTS = ["date", "amount"] as const;

export const MAX_AMOUNT = 1_000_000_000_000;
export const MAX_NOTE_LENGTH = 200;
export const MAX_NAME_LENGTH = 100;

const objectError: z.core.$ZodErrorMap = (issue) =>
  issue.code === "unrecognized_keys"
    ? `Field ${issue.keys.join(", ")} gak boleh dikirim.`
    : "Datanya harus berupa objek.";

// Shared by the form (client) and the API (server), so both reject exactly the same input.
// Strict: unknown keys such as user_id or settled_at are refused instead of silently passed on.
export const debtInputSchema = z.strictObject(
  {
    type: z.enum(DEBT_TYPES, "Pilih tipenya dulu ya."),
    counterpart_name: z
      .string("Namanya diisi dulu ya.")
      .trim()
      .min(1, "Namanya diisi dulu ya.")
      .max(MAX_NAME_LENGTH, `Namanya kepanjangan, maksimal ${MAX_NAME_LENGTH} karakter.`),
    amount: z
      .number("Jumlahnya harus angka.")
      .int("Jumlahnya harus angka bulat, tanpa koma.")
      .positive("Jumlahnya harus lebih dari Rp 0.")
      .max(MAX_AMOUNT, "Jumlahnya kegedean."),
    due_date: z.iso.date("Tanggalnya gak valid."),
    note: z
      .string("Catatannya gak valid.")
      .trim()
      .max(MAX_NOTE_LENGTH, `Catatan maksimal ${MAX_NOTE_LENGTH} karakter.`)
      .optional(),
  },
  { error: objectError },
);

export const debtUpdateSchema = debtInputSchema
  .partial()
  .extend({ settled: z.boolean("Status lunasnya harus true/false.").optional() })
  .refine((value) => Object.keys(value).length > 0, "Gak ada yang diubah.");

export const debtQuerySchema = z.object({
  status: z.enum(["all", ...DEBT_STATUSES], "Filter status gak dikenal.").default("all"),
  type: z.enum(["all", ...DEBT_TYPES], "Filter tipe gak dikenal.").default("all"),
  q: z.string().trim().max(MAX_NAME_LENGTH, "Kata kuncinya kepanjangan.").default(""),
  sort: z.enum(DEBT_SORTS, "Urutan gak dikenal.").default("date"),
});

export const debtIdSchema = z.uuid("ID catatannya gak valid.");

export type DebtInput = z.infer<typeof debtInputSchema>;
export type DebtUpdate = z.infer<typeof debtUpdateSchema>;
export type DebtQuery = z.infer<typeof debtQuerySchema>;
