"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FormField } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { submitEnquiry, type ApplyState } from "./actions";

const AUTOCOMPLETE: Record<string, string> = { parentName: "name", email: "email", phone: "tel", learnerName: "off" };

function Control({ f, value, error, grades, years }: { f: FormField; value?: string; error?: string; grades: string[]; years: number[] }) {
  const common = {
    id: f.key,
    name: f.key,
    required: f.required,
    defaultValue: value,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${f.key}-error` : undefined,
  };
  if (f.key === "grade") {
    return (
      <Select {...common} defaultValue={value ?? ""}>
        <option value="" disabled>Choose a grade</option>
        {grades.map((g) => (
          <option key={g} value={g === "R" ? "Grade R" : `Grade ${g}`}>{g === "R" ? "Grade R" : `Grade ${g}`}</option>
        ))}
      </Select>
    );
  }
  if (f.key === "startYear") {
    return (
      <Select {...common} defaultValue={value ?? ""}>
        <option value="" disabled>Choose a year</option>
        {years.map((y) => (
          <option key={y}>{y}</option>
        ))}
      </Select>
    );
  }
  if (f.type === "textarea") return <Textarea {...common} rows={4} />;
  return (
    <Input
      {...common}
      type={f.type === "select" ? "text" : f.type}
      inputMode={f.type === "tel" ? "tel" : f.type === "number" ? "numeric" : f.type === "email" ? "email" : undefined}
      autoComplete={AUTOCOMPLETE[f.key] ?? (f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined)}
      autoCapitalize={f.type === "email" ? "none" : undefined}
      autoCorrect={f.type === "email" ? "off" : undefined}
    />
  );
}

const initial: ApplyState = { ok: false, errors: {}, values: {} };

function TheForm(props: { fields: FormField[]; grades: string[]; years: number[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (p: ApplyState, fd: FormData) => {
    const r = await submitEnquiry(p, fd);
    if (r.ok) props.onDone();
    return r;
  }, initial);
  if (state.closed) {
    return <p className="rounded-xl bg-amber-50 p-4 font-semibold text-amber-900" role="alert">Admissions have just closed. Please refresh the page.</p>;
  }
  return (
    <form action={action} noValidate className="space-y-5">
      {props.fields.map((f) => (
        <Field key={f.key} label={f.label} htmlFor={f.key} required={f.required} error={state.errors[f.key]}>
          <Control f={f} value={state.values[f.key]} error={state.errors[f.key]} grades={props.grades} years={props.years} />
        </Field>
      ))}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" variant="accent" size="full" disabled={pending}>
        {pending ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}

export function ApplyForm(props: { fields: FormField[]; grades: string[]; years: number[]; replyDays: number }) {
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  if (done) {
    return (
      <div className="space-y-4 py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-green-700" aria-hidden />
        <p className="text-xl font-semibold text-slate-900">Thank you — we&apos;ve received your enquiry</p>
        <p className="text-slate-700">
          An admissions officer will contact you within {props.replyDays} working day{props.replyDays === 1 ? "" : "s"}.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ variant: "primary" })}>Back to home</Link>
          <Button type="button" variant="outline" onClick={() => { setDone(false); setRound((r) => r + 1); }}>
            Submit another enquiry
          </Button>
        </div>
      </div>
    );
  }
  return <TheForm key={round} fields={props.fields} grades={props.grades} years={props.years} onDone={() => setDone(true)} />;
}
