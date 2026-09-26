"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { submitQuote } from "@/app/actions/public";
import { BUDGETS, HOME_SIZES, PROPERTY_TYPES, QUOTE_SCOPES, TIMELINES } from "@/lib/validators";
import { Honeypot, Turnstile } from "@/components/ui/turnstile";
import { useActionForm } from "./use-form";
import { cn } from "@/lib/utils";

const STEPS = ["Your home", "What you need", "Your details"] as const;

function Choice({ name, options, value, onChange }: { name: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
          className={cn("min-h-11 rounded-full border px-4 text-[15px] transition-colors", value === o ? "border-bottle bg-bottle text-paper" : "border-line bg-paper hover:border-ink")}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function QuoteForm() {
  const router = useRouter();
  const { pending, error, fieldErrors, run } = useActionForm();
  const [step, setStep] = useState(0);
  const [hp, setHp] = useState("");
  const [token, setToken] = useState("");
  const [localErr, setLocalErr] = useState("");
  const [f, setF] = useState({
    propertyType: "", homeSize: "", city: "", scope: [] as string[], budget: "", timeline: "", name: "", phone: "", email: "", message: "",
  });
  const up = (k: keyof typeof f, v: string | string[]) => setF((s) => ({ ...s, [k]: v }));

  const canNext = [
    Boolean(f.propertyType && f.homeSize && f.city.trim().length >= 2),
    Boolean(f.scope.length && f.budget && f.timeline),
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr("");
    if (f.name.trim().length < 2) return setLocalErr("Please enter your name.");
    if (!/^[6-9]\d{9}$/.test(f.phone)) return setLocalErr("Enter a valid 10-digit mobile number.");
    const res = await run(() => submitQuote({ ...f, website: hp, turnstileToken: token }));
    if (res.ok) router.push("/thank-you?type=quote");
  }

  return (
    <form onSubmit={submit} noValidate className="relative rounded-lg border border-line bg-paper p-6 sm:p-9">
      <ol className="mb-8 flex gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={cn("h-1 rounded-full transition-colors duration-300", i <= step ? "bg-bottle" : "bg-line")} />
            <p className={cn("mt-2 text-sm", i === step ? "font-medium text-ink" : "text-muted")} aria-current={i === step ? "step" : undefined}>
              <span className="sr-only">Step {i + 1}: </span>{s}
            </p>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }} className="space-y-7">
          {step === 0 && (
            <>
              <div><p className="label-text">Type of property</p><Choice name="Type of property" options={PROPERTY_TYPES} value={f.propertyType} onChange={(v) => up("propertyType", v)} /></div>
              <div><p className="label-text">Size</p><Choice name="Size" options={HOME_SIZES} value={f.homeSize} onChange={(v) => up("homeSize", v)} /></div>
              <div>
                <label htmlFor="q-city" className="label-text">City</label>
                <input id="q-city" className="field max-w-sm" value={f.city} onChange={(e) => up("city", e.target.value)} maxLength={60} autoComplete="address-level2" placeholder="Mumbai" />
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <fieldset>
                <legend className="label-text">What would you like us to design? Pick all that apply.</legend>
                <div className="flex flex-wrap gap-2">
                  {QUOTE_SCOPES.map((s) => {
                    const on = f.scope.includes(s);
                    return (
                      <button key={s} type="button" aria-pressed={on} onClick={() => up("scope", on ? f.scope.filter((x) => x !== s) : [...f.scope, s])}
                        className={cn("min-h-11 rounded-full border px-4 text-[15px] transition-colors", on ? "border-bottle bg-bottle text-paper" : "border-line bg-paper hover:border-ink")}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div><p className="label-text">Budget</p><Choice name="Budget" options={BUDGETS} value={f.budget} onChange={(v) => up("budget", v)} /></div>
              <div><p className="label-text">When do you want to start?</p><Choice name="Timeline" options={TIMELINES} value={f.timeline} onChange={(v) => up("timeline", v)} /></div>
            </>
          )}
          {step === 2 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="q-name" className="label-text">Your name</label>
                <input id="q-name" className="field" value={f.name} onChange={(e) => up("name", e.target.value)} maxLength={80} autoComplete="name" />
                {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="q-phone" className="label-text">Mobile number</label>
                <input id="q-phone" className="field" inputMode="numeric" value={f.phone} onChange={(e) => up("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} autoComplete="tel-national" placeholder="10-digit number" />
                {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="q-email" className="label-text">Email <span className="font-normal text-muted">(optional)</span></label>
                <input id="q-email" type="email" className="field" value={f.email} onChange={(e) => up("email", e.target.value)} maxLength={200} autoComplete="email" />
                {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="q-msg" className="label-text">Anything else? <span className="font-normal text-muted">(optional)</span></label>
                <textarea id="q-msg" rows={4} className="field" value={f.message} onChange={(e) => up("message", e.target.value)} maxLength={1500} placeholder="Possession date, a style you like, what's not working in your current home…" />
              </div>
              <Honeypot value={hp} onChange={setHp} />
              <div className="sm:col-span-2"><Turnstile onToken={setToken} /></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {(localErr || error) && <p role="alert" className="field-error mt-5">{localErr || error}</p>}

      <div className="mt-9 flex items-center justify-between gap-3">
        {step > 0 ? <button type="button" className="btn-outline" onClick={() => setStep((s) => s - 1)}>Back</button> : <span />}
        {step < 2 ? (
          <button type="button" className="btn-primary" disabled={!canNext[step]} onClick={() => setStep((s) => s + 1)}>Continue</button>
        ) : (
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Sending…" : "Request my quote"}</button>
        )}
      </div>
    </form>
  );
}
