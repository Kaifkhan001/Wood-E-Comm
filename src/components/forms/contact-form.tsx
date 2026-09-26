"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitContact } from "@/app/actions/public";
import { Honeypot, Turnstile } from "@/components/ui/turnstile";
import { useActionForm } from "./use-form";

export function ContactForm() {
  const router = useRouter();
  const { pending, error, fieldErrors, run } = useActionForm();
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [hp, setHp] = useState("");
  const [token, setToken] = useState("");

  return (
    <form
      noValidate
      className="relative grid gap-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await run(() => submitContact({ ...f, website: hp, turnstileToken: token }));
        if (res.ok) router.push("/thank-you?type=contact");
      }}
    >
      <div>
        <label htmlFor="c-name" className="label-text">Name</label>
        <input id="c-name" className="field" required maxLength={80} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
      </div>
      <div>
        <label htmlFor="c-email" className="label-text">Email</label>
        <input id="c-email" type="email" className="field" required maxLength={200} autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-phone" className="label-text">Mobile <span className="font-normal text-muted">(optional)</span></label>
        <input id="c-phone" inputMode="numeric" className="field sm:max-w-xs" autoComplete="tel-national" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
        {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-msg" className="label-text">How can we help?</label>
        <textarea id="c-msg" rows={5} className="field" required maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        {fieldErrors.message && <p className="field-error">{fieldErrors.message}</p>}
      </div>
      <Honeypot value={hp} onChange={setHp} />
      <div className="sm:col-span-2"><Turnstile onToken={setToken} /></div>
      {error && <p role="alert" className="field-error sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2"><button type="submit" className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Send message"}</button></div>
    </form>
  );
}
