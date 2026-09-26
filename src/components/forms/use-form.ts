"use client";
import { useState } from "react";
import type { ActionResult } from "@/lib/validators";

/** Small helper for client forms backed by server actions. */
export function useActionForm<T>() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function run(fn: () => Promise<ActionResult<T>>) {
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
      return res;
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      return { ok: false as const, error: "network" };
    } finally {
      setPending(false);
    }
  }
  return { pending, error, fieldErrors, run, setFieldErrors };
}
