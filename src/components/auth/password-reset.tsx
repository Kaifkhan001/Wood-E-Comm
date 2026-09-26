"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (sent) {
    return (
      <div className="max-w-md">
        <h1 className="text-[40px] leading-tight">Check your email</h1>
        <p className="mt-3 text-muted">If an account exists for {email}, we&apos;ve sent a link to reset your password. It&apos;s valid for one hour.</p>
        <Link href="/login" className="btn-outline mt-6">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form
      className="w-full max-w-md"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setPending(true);
        const res = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
        setPending(false);
        // Same response whether or not the account exists (no account enumeration).
        if (res.error?.status === 429) return setError("Too many attempts. Please wait a few minutes.");
        setSent(true);
      }}
    >
      <h1 className="text-[40px] leading-tight">Reset your password</h1>
      <p className="mt-2 text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <label htmlFor="f-email" className="label-text mt-8">Email</label>
      <input id="f-email" type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-primary mt-5 w-full" disabled={pending || !email}>{pending ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  if (!token) return <p className="max-w-md text-lg">This reset link is invalid or has expired. <Link href="/forgot-password" className="underline">Request a new one</Link>.</p>;
  if (done) return (
    <div className="max-w-md"><h1 className="text-[40px] leading-tight">Password updated</h1><Link href="/login" className="btn-primary mt-6">Sign in</Link></div>
  );
  return (
    <form
      className="w-full max-w-md"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError("Use at least 8 characters.");
        setPending(true);
        const res = await authClient.resetPassword({ newPassword: password, token });
        setPending(false);
        if (res.error) return setError("This reset link is invalid or has expired. Request a new one.");
        setDone(true);
      }}
    >
      <h1 className="text-[40px] leading-tight">Choose a new password</h1>
      <label htmlFor="r-pass" className="label-text mt-8">New password</label>
      <input id="r-pass" type="password" className="field" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn-primary mt-5 w-full" disabled={pending}>{pending ? "Saving…" : "Update password"}</button>
    </form>
  );
}
