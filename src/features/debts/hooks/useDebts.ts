"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { debtsApi, SessionExpiredError } from "../api";
import type { Debt } from "../types";

type Result = { key: string; debts?: Debt[]; error?: string };
type Waiter = { version: number; resolve: () => void };

/**
 * Loads GET /api/debts?{searchParams}. Keeps the previous list on screen while a new one loads,
 * and ignores responses for filters the user has already moved away from. Pass null to skip.
 */
export function useDebts(searchParams: string | null) {
  const router = useRouter();
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [lastDebts, setLastDebts] = useState<Debt[] | undefined>(undefined);
  const versionRef = useRef(0);
  const waiters = useRef<Waiter[]>([]);
  const key = `${searchParams}#${version}`;

  useEffect(() => {
    // Resolve every reload() promise that this load (or a later one) satisfies.
    const settleWaiters = () => {
      waiters.current = waiters.current.filter((waiter) => {
        if (waiter.version > version) return true;
        waiter.resolve();
        return false;
      });
    };

    if (searchParams === null) return settleWaiters();
    const controller = new AbortController();
    debtsApi.list(searchParams, controller.signal).then(
      (debts) => {
        setResult({ key, debts });
        setLastDebts(debts);
        settleWaiters();
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        // Retrying would only 401 again; proxy.ts lets a session-less user onto /login.
        if (error instanceof SessionExpiredError) return router.replace("/login");
        setResult({ key, error: error instanceof Error ? error.message : String(error) });
        settleWaiters();
      },
    );
    return () => controller.abort();
  }, [searchParams, key, version, router]);

  /** Refetches; the promise resolves once the fresh data (or its error) has landed. */
  const reload = useCallback(() => {
    versionRef.current += 1;
    const target = versionRef.current;
    setVersion(target);
    return new Promise<void>((resolve) => waiters.current.push({ version: target, resolve }));
  }, []);
  const isCurrent = result?.key === key;

  return {
    debts: lastDebts,
    error: isCurrent ? result.error : undefined,
    isLoading: !isCurrent,
    reload,
  };
}
