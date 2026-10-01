"use client";

import { useCallback, useEffect, useState } from "react";

import { debtsApi } from "../api";
import type { Debt } from "../types";

type Result = { key: string; debts?: Debt[]; error?: string };

/**
 * Loads GET /api/debts?{searchParams}. Keeps the previous list on screen while a new one loads,
 * and ignores responses for filters the user has already moved away from. Pass null to skip.
 */
export function useDebts(searchParams: string | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [lastDebts, setLastDebts] = useState<Debt[] | undefined>(undefined);
  const key = `${searchParams}#${version}`;

  useEffect(() => {
    if (searchParams === null) return;
    const controller = new AbortController();
    debtsApi.list(searchParams, controller.signal).then(
      (debts) => {
        setResult({ key, debts });
        setLastDebts(debts);
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key, error: error instanceof Error ? error.message : String(error) });
      },
    );
    return () => controller.abort();
  }, [searchParams, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const isCurrent = result?.key === key;

  return {
    debts: lastDebts,
    error: isCurrent ? result.error : undefined,
    isLoading: !isCurrent,
    reload,
  };
}
