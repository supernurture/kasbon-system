import { debtIdSchema, debtUpdateSchema } from "@/features/debts/schemas";
import { DEBT_COLUMNS } from "@/features/debts/types";
import type { Database } from "@/shared/lib/supabase/database.types";
import { jsonError, readJson, requireUser, serverError, validationError } from "@/shared/lib/http";

type DebtUpdateRow = Database["public"]["Tables"]["debts"]["Update"];

const NOT_FOUND = "Catatannya gak ketemu.";

export async function PATCH(request: Request, ctx: RouteContext<"/api/debts/[id]">) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const id = debtIdSchema.safeParse((await ctx.params).id);
  if (!id.success) return validationError(id.error);

  const json = await readJson(request);
  if (!json.ok) return jsonError(400, "Format datanya gak valid.");

  const parsed = debtUpdateSchema.safeParse(json.body);
  if (!parsed.success) return validationError(parsed.error);
  const { settled, note, ...fields } = parsed.data;

  // RLS hides other users' rows, so "not found" and "not yours" look the same: 404.
  const { data: current, error: findError } = await auth.supabase
    .from("debts")
    .select(DEBT_COLUMNS)
    .eq("id", id.data)
    .maybeSingle();
  if (findError) return serverError("PATCH /api/debts/[id] find", findError);
  if (!current) return jsonError(404, NOT_FOUND);

  const update: DebtUpdateRow = { ...fields };
  if (note !== undefined) update.note = note || null;
  // Idempotent: settling twice keeps the original settled_at instead of moving it.
  if (settled === true && current.settled_at === null) update.settled_at = new Date().toISOString();
  if (settled === false) update.settled_at = null;

  if (Object.keys(update).length === 0) return Response.json({ data: current });

  const { data, error } = await auth.supabase
    .from("debts")
    .update(update)
    .eq("id", id.data)
    .select(DEBT_COLUMNS)
    .maybeSingle();
  if (error) return serverError("PATCH /api/debts/[id]", error);
  if (!data) return jsonError(404, NOT_FOUND);

  return Response.json({ data });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/debts/[id]">) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const id = debtIdSchema.safeParse((await ctx.params).id);
  if (!id.success) return validationError(id.error);

  const { data, error } = await auth.supabase.from("debts").delete().eq("id", id.data).select("id");
  if (error) return serverError("DELETE /api/debts/[id]", error);
  if (data.length === 0) return jsonError(404, NOT_FOUND);

  return new Response(null, { status: 204 });
}
