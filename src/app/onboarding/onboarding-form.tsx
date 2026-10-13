"use client";

import { useActionState, useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { completeOnboarding, type OnboardingState } from "./actions";
import { contrast, isHex, normalizeHex, themeVars, DEFAULT_ACCENT, DEFAULT_PRIMARY } from "@/lib/colors";

const PRESETS = [
  { name: "Navy & gold", p: "#0B1F3A", a: "#D4A62A" },
  { name: "Maroon & gold", p: "#6B1D2A", a: "#E0B33A" },
  { name: "Forest & cream", p: "#14532D", a: "#F2D16B" },
  { name: "Royal & sky", p: "#1E3A8A", a: "#38BDF8" },
  { name: "Charcoal & red", p: "#1F2937", a: "#DC2626" },
];

function ColorInput({ id, label, value, onChange, error, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint: string }) {
  return (
    <Field label={label} htmlFor={id} required hint={hint} error={error}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={isHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-12 w-16 shrink-0 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
        />
        <Input
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onChange(normalizeHex(e.target.value, value))}
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
          pattern="#[0-9A-Fa-f]{6}"
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint`}
          required
        />
      </div>
    </Field>
  );
}

function Rating({ ratio, label }: { ratio: number; label: string }) {
  const ok = ratio >= 4.5;
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? <Check className="size-4 text-green-700" aria-hidden /> : <AlertTriangle className="size-4 text-amber-700" aria-hidden />}
      <span>
        {label}: <strong>{ratio.toFixed(1)}:1</strong> {ok ? "passes AA" : "adjusted automatically for readability"}
      </span>
    </li>
  );
}

export function OnboardingForm({ needsToken }: { needsToken: boolean }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, {
    errors: {},
    values: { primaryColor: DEFAULT_PRIMARY, accentColor: DEFAULT_ACCENT },
  });
  const [name, setName] = useState(state.values.schoolName ?? "");
  const [primary, setPrimary] = useState(state.values.primaryColor ?? DEFAULT_PRIMARY);
  const [accent, setAccent] = useState(state.values.accentColor ?? DEFAULT_ACCENT);

  const p = normalizeHex(primary, DEFAULT_PRIMARY);
  const a = normalizeHex(accent, DEFAULT_ACCENT);
  const vars = themeVars(p, a);
  const e = state.errors;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <form action={action} className="card space-y-6 p-5 sm:p-8" noValidate>
        {needsToken && (
          <Field label="Setup code" htmlFor="setupToken" required hint="From your IT administrator (the SETUP_TOKEN value)." error={e.setupToken}>
            <Input id="setupToken" name="setupToken" type="password" autoComplete="off" aria-invalid={Boolean(e.setupToken)} required />
          </Field>
        )}

        <fieldset className="space-y-5">
          <legend className="mb-2 text-lg font-semibold text-slate-900">1. Your school</legend>
          <Field label="School name" htmlFor="schoolName" required error={e.schoolName}>
            <Input id="schoolName" name="schoolName" value={name} onChange={(ev) => setName(ev.target.value)} autoComplete="organization" aria-invalid={Boolean(e.schoolName)} required />
          </Field>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-2 text-lg font-semibold text-slate-900">2. Brand colours</legend>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">Quick start</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((pr) => (
                <button
                  type="button"
                  key={pr.name}
                  onClick={() => {
                    setPrimary(pr.p);
                    setAccent(pr.a);
                  }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold hover:bg-slate-50"
                  aria-pressed={p === pr.p && a === pr.a}
                >
                  <span className="flex" aria-hidden>
                    <span className="size-5 rounded-l-md" style={{ background: pr.p }} />
                    <span className="size-5 rounded-r-md" style={{ background: pr.a }} />
                  </span>
                  {pr.name}
                </button>
              ))}
            </div>
          </div>
          <ColorInput id="primaryColor" label="Primary colour" hint="Header, footer and main buttons." value={primary} onChange={setPrimary} error={e.primaryColor} />
          <ColorInput id="accentColor" label="Highlight colour" hint="Apply Now, underlines and highlights." value={accent} onChange={setAccent} error={e.accentColor} />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-2 text-lg font-semibold text-slate-900">3. First administrator</legend>
          <p className="text-sm text-slate-600">This person signs in through the Portal with their Microsoft school account and can invite everyone else.</p>
          <Field label="Full name" htmlFor="adminName" required error={e.adminName}>
            <Input id="adminName" name="adminName" defaultValue={state.values.adminName} autoComplete="name" aria-invalid={Boolean(e.adminName)} required />
          </Field>
          <Field label="School email" htmlFor="adminEmail" required error={e.adminEmail}>
            <Input id="adminEmail" name="adminEmail" type="email" defaultValue={state.values.adminEmail} autoComplete="email" autoCorrect="off" autoCapitalize="none" aria-invalid={Boolean(e.adminEmail)} required />
          </Field>
        </fieldset>

        <Button type="submit" variant="primary" size="full" disabled={pending} style={{ background: p, color: vars["--brand-primary-fg"] }}>
          {pending ? "Setting up…" : "Finish setup"}
        </Button>
      </form>

      <aside aria-label="Live preview" className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-sm font-semibold text-slate-700">Live preview</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: "#fff", borderBottom: `3px solid ${a}` }}>
            <span className="truncate font-semibold" style={{ fontFamily: "var(--font-heading)", color: vars["--brand-primary-ink"] }}>
              {name || "Your School Name"}
            </span>
            <span className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: a, color: vars["--brand-accent-fg"] }}>
              Apply Now
            </span>
          </div>
          <div className="space-y-3 px-5 py-8" style={{ background: p, color: vars["--brand-primary-fg"] }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: vars["--brand-accent-on-primary"] }}>
              Admissions now open
            </p>
            <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)", color: vars["--brand-primary-fg"] }}>
              Where every learner is known by name
            </p>
            <div className="flex gap-2 pt-2">
              <span className="rounded-lg border-2 px-3 py-1.5 text-sm font-semibold" style={{ borderColor: vars["--brand-primary-fg"] }}>
                Portal
              </span>
              <span className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: a, color: vars["--brand-accent-fg"] }}>
                Apply Now
              </span>
            </div>
          </div>
          <div className="space-y-1 bg-white px-5 py-4">
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: vars["--brand-accent-ink"] }}>Highlight text on white</p>
            <p className="text-sm" style={{ color: vars["--brand-primary-ink"] }}>Primary text on white</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5" aria-label="Contrast checks">
          <Rating label="Text on primary" ratio={contrast(p, vars["--brand-primary-fg"])} />
          <Rating label="Text on highlight" ratio={contrast(a, vars["--brand-accent-fg"])} />
          <Rating label="Highlight as text on white" ratio={contrast(a, "#FFFFFF")} />
        </ul>
        <p className="mt-2 text-sm text-slate-600">Where a colour is too light to read, the site uses a darker shade of it for text so every page stays WCAG AA.</p>
      </aside>
    </div>
  );
}
