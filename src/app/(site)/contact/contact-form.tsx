"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { sendMessage, type FormState } from "./actions";

const initial: FormState = { ok: false, errors: {}, values: {} };

function Form({ departments, onSent }: { departments: string[]; onSent: () => void }) {
  const [state, action, pending] = useActionState(async (p: FormState, fd: FormData) => {
    const r = await sendMessage(p, fd);
    if (r.ok) onSent();
    return r;
  }, initial);
  const e = state.errors;
  const v = state.values;
  const aria = (k: string) => ({ "aria-invalid": Boolean(e[k]), "aria-describedby": e[k] ? `${k}-error` : undefined });

  return (
    <form action={action} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required error={e.name}>
          <Input id="name" name="name" autoComplete="name" defaultValue={v.name} required {...aria("name")} />
        </Field>
        <Field label="Email" htmlFor="email" required error={e.email}>
          <Input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" defaultValue={v.email} required {...aria("email")} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={e.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={v.phone} {...aria("phone")} />
        </Field>
        <Field label="Department" htmlFor="department">
          <Select id="department" name="department" defaultValue={v.department ?? ""}>
            <option value="">General enquiry</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Message" htmlFor="message" required error={e.message}>
        <Textarea id="message" name="message" rows={5} defaultValue={v.message} required {...aria("message")} />
      </Field>
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

export function ContactForm({ departments }: { departments: string[] }) {
  const [sent, setSent] = useState(false);
  const [round, setRound] = useState(0);
  if (sent) {
    return (
      <div className="space-y-4 py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-green-700" aria-hidden />
        <p className="text-xl font-semibold text-slate-900">Thank you — your message has been sent</p>
        <p className="text-slate-700">We&apos;ll get back to you as soon as we can.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSent(false);
            setRound((r) => r + 1);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }
  return <Form key={round} departments={departments} onSent={() => setSent(true)} />;
}
