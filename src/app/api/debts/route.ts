import { debtInputSchema, debtQuerySchema } from "@/features/debts/schemas";
import { DEBT_COLUMNS } from "@/features/debts/types";
import { jsonError, readJson, requireUser, serverError, validationError } from "@/shared/lib/http";

// Escape LIKE wildcards so a search for "50%" matches literally.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = debtQuerySchema.safeParse(params);
  if (!parsed.success) return validationError(parsed.error);
  const { status, type, q, sort } = parsed.data;

  let query = auth.supabase.from("debts").select(DEBT_COLUMNS);

  if (status === "open") query = query.is("settled_at", null);
  if (status === "settled") query = query.not("settled_at", "is", null);
  if (type !== "all") query = query.eq("type", type);
  if (q) query = query.ilike("counterpart_name", `%${escapeLike(q)}%`);

  query =
    sort === "amount"
      ? query.order("amount", { ascending: false })
      : query.order("due_date", { ascending: false, nullsFirst: false });
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return serverError("GET /api/debts", error);

  return Response.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const json = await readJson(request);
  if (!json.ok) return jsonError(400, "Format datanya gak valid.");

  const parsed = debtInputSchema.safeParse(json.body);
  if (!parsed.success) return validationError(parsed.error);
  const { note, ...fields } = parsed.data;

  const { data, error } = await auth.supabase
    .from("debts")
    .insert({ ...fields, note: note || null, user_id: auth.userId })
    .select(DEBT_COLUMNS)
    .single();
  if (error) return serverError("POST /api/debts", error);

  return Response.json({ data }, { status: 201 });
}
