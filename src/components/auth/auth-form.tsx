"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { GoogleIcon } from "@/components/ui/icons";
import { safeNext } from "@/lib/safe-redirect";

function friendly(code?: string, message?: string) {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD": return "That email and password don't match. Try again or reset your password.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL": return "An account with this email already exists. Sign in instead.";
    case "PASSWORD_TOO_SHORT": return "Use at least 8 characters for your password.";
    case "INVALID_EMAIL": return "Enter a valid email address.";
    default:
      if (message?.toLowerCase().includes("too many")) return "Too many attempts. Please wait a minute and try again.";
      return "We couldn't sign you in. Please try again.";
  }
}

export function AuthForm({ mode, next, googleEnabled }: { mode: "login" | "signup"; next?: string; googleEnabled: boolean }) {
  // Sanitised but with no forced fallback here: the role-aware default (admin -> /admin,
  // customer -> /) is decided server-side by /auth/continue once we know who signed in.
  const safePath = next ? safeNext(next, "") : "";
  const continueUrl = `/auth/continue?next=${encodeURIComponent(safePath)}`;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "signup" && name.trim().length < 2) return setError("Enter your name.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setPending(true);
    const res =
      mode === "login"
        ? await signIn.email({ email: email.trim(), password })
        : await signUp.email({ name: name.trim(), email: email.trim(), password });
    setPending(false);
    if (res.error) {
      if (res.error.status === 429) return setError("Too many attempts. Please wait a minute and try again.");
      return setError(friendly(res.error.code, res.error.message));
    }
    // Full navigation so every server component sees the new session cookie.
    window.location.assign(continueUrl);
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-[40px] leading-tight">{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-2 text-muted">
        {mode === "login" ? "Track orders and quotes in one place." : "Order furniture and follow your quotes."}
      </p>

      {googleEnabled && (
        <>
          <button
            type="button"
            className="btn-outline mt-8 w-full bg-paper"
            onClick={() => signIn.social({ provider: "google", callbackURL: continueUrl })}
          >
            <GoogleIcon className="h-5 w-5" /> Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-sm text-muted"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>
        </>
      )}

      <form onSubmit={onSubmit} noValidate className={googleEnabled ? "space-y-4" : "mt-8 space-y-4"}>
        {mode === "signup" && (
          <div><label htmlFor="a-name" className="label-text">Name</label><input id="a-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
        )}
        <div><label htmlFor="a-email" className="label-text">Email</label><input id="a-email" type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} /></div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="a-pass" className="label-text">Password</label>
            {mode === "login" && <Link href="/forgot-password" className="text-sm text-muted underline-offset-4 hover:underline">Forgot password?</Link>}
          </div>
          <input id="a-pass" type="password" className="field" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
          {mode === "signup" && <p className="mt-1 text-sm text-muted">At least 8 characters.</p>}
        </div>
        {error && <p role="alert" className="field-error">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-[15px] text-muted">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <Link href={`${mode === "login" ? "/signup" : "/login"}${safePath ? `?next=${encodeURIComponent(safePath)}` : ""}`} className="text-ink underline underline-offset-4">
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
