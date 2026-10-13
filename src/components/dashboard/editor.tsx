import Image from "next/image";
import Link from "next/link";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AutoNote } from "./ui";

export function TF({
  name,
  label,
  value,
  required,
  hint,
  textarea,
  type = "text",
  rows = 3,
  inputMode,
  className,
}: {
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  hint?: string;
  textarea?: boolean;
  type?: string;
  rows?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}) {
  const id = `f-${name.replace(/[^a-z0-9]/gi, "-")}`;
  return (
    <Field label={label} htmlFor={id} required={required} hint={hint} className={className}>
      {textarea ? (
        <Textarea id={id} name={name} defaultValue={value} rows={rows} aria-describedby={hint ? `${id}-hint` : undefined} />
      ) : (
        <Input id={id} name={name} type={type} defaultValue={value} inputMode={inputMode} aria-describedby={hint ? `${id}-hint` : undefined} />
      )}
    </Field>
  );
}

export function ImageField({ name, label, current, hint, round }: { name: string; label: string; current: string; hint?: string; round?: boolean }) {
  const id = `f-${name.replace(/[^a-z0-9]/gi, "-")}`;
  return (
    <Field label={label} htmlFor={id} hint={hint ?? "JPG or PNG, up to 10 MB."}>
      <input type="hidden" name={`${name}__current`} value={current} />
      <div className="flex flex-wrap items-center gap-4">
        {current && (
          <div className={`relative size-20 shrink-0 overflow-hidden bg-slate-100 ${round ? "rounded-full" : "rounded-xl"}`}>
            <Image src={current} alt="Current image" fill sizes="80px" className="object-cover" />
          </div>
        )}
        <Input id={id} name={`${name}__file`} type="file" accept="image/jpeg,image/png" className="max-w-sm flex-1 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:font-semibold" />
        {current && (
          <label className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-red-700">
            <input type="checkbox" name={`${name}__remove`} className="size-5" /> Remove
          </label>
        )}
      </div>
    </Field>
  );
}

export function Section({ n, id, title, auto, children }: { n: number; id: string; title: string; auto?: { href: string; label: string; text: string }; children?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card scroll-mt-24 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-h`} className="text-lg font-semibold">
          <span className="mr-2 inline-grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-fg" aria-hidden>{n}</span>
          {title}
        </h2>
        {auto && <AutoNote />}
      </div>
      {auto ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
          <p className="text-slate-700">{auto.text}</p>
          <Link href={auto.href} className="inline-flex min-h-12 items-center font-semibold text-primary-ink underline underline-offset-4">{auto.label}</Link>
        </div>
      ) : (
        <div className="space-y-5">{children}</div>
      )}
    </section>
  );
}

export function JumpTo({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Jump to section" className="mb-6 rounded-xl bg-white p-3">
      <p className="mb-1 px-1 text-sm font-semibold text-slate-600">Jump to</p>
      <ol className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="inline-flex min-h-12 items-center rounded-lg px-3 text-sm font-semibold text-primary-ink hover:bg-primary-soft">
              {i + 1}. {it.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** DB-04.7 — the Publish / Save-as-draft bar stays visible while scrolling. */
export function PublishBar({ hasDraft }: { hasDraft: boolean }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
      <Button type="submit" name="intent" value="publish">Publish</Button>
      <Button type="submit" name="intent" value="draft" variant="outline">Save as draft</Button>
      <p className="text-sm text-slate-600">{hasDraft ? "You have unpublished changes." : "Publishing makes every section live together."}</p>
    </div>
  );
}
