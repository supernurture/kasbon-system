import type { DebtInput, DebtQuery, DebtUpdate } from "./schemas";
import type { Debt } from "./types";

const FALLBACK_ERROR = "Waduh, ada yang error. Coba lagi ya.";

function errorMessage(body: unknown) {
  if (typeof body === "object" && body !== null && "error" in body) {
    const { error } = body;
    if (typeof error === "string") return error;
  }
  return FALLBACK_ERROR;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (cause) {
    if (init?.signal?.aborted) throw cause;
    throw new Error("Koneksinya lagi rewel kayaknya. Coba lagi ya.");
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body));
  return (body as { data: T }).data;
}

export function toSearchParams(query: DebtQuery) {
  const params = new URLSearchParams();
  if (query.status !== "all") params.set("status", query.status);
  if (query.type !== "all") params.set("type", query.type);
  if (query.q) params.set("q", query.q);
  if (query.sort !== "date") params.set("sort", query.sort);
  return params.toString();
}

export const debtsApi = {
  list: (searchParams: string, signal?: AbortSignal) =>
    request<Debt[]>(`/api/debts${searchParams ? `?${searchParams}` : ""}`, { signal }),

  create: (input: DebtInput) =>
    request<Debt>("/api/debts", { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, patch: DebtUpdate) =>
    request<Debt>(`/api/debts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  remove: (id: string) =>
    request<void>(`/api/debts/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
