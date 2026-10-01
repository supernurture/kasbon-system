import "server-only";

import type { ZodError } from "zod";

import { createClient } from "@/shared/lib/supabase/server";

const INTERNAL_ERROR = "Waduh, ada yang error di server. Coba lagi ya.";

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

export function validationError(error: ZodError) {
  return jsonError(400, error.issues[0]?.message ?? "Datanya gak valid.");
}

export function serverError(context: string, cause: unknown) {
  // Log the real cause server-side only; the client never sees database details.
  console.error(`[${context}]`, cause);
  return jsonError(500, INTERNAL_ERROR);
}

export async function readJson(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}

type AuthedContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; response: Response };

// The returned client carries the caller's JWT, so every query is still filtered by RLS.
export async function requireUser(): Promise<AuthedContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, response: jsonError(401, "Kamu harus login dulu.") };
  return { ok: true, supabase, userId: user.id };
}
