import type { Metadata } from "next";
import Link from "next/link";
import { Award, FileCheck2, Phone, Quote } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ALL_GRADES, MAX_FORM_FIELDS, getPage, getSiteSettings } from "@/lib/content";
import { fmtLong } from "@/lib/dates";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = { title: "Apply Now" };

const STEPS = [
  { title: "We call you", text: "An admissions officer phones to answer your questions." },
  { title: "Campus tour", text: "Visit the school, meet teachers and see classrooms in action." },
  { title: "Full application", text: "We send you the full application and help you complete it." },
];

const DOCUMENTS = [
  "Learner's birth certificate",
  "Latest school report",
  "Immunisation card (Grade R–1)",
  "Parent/guardian ID copies",
  "Proof of residence",
];

const tel = (p: string) => p.replace(/[^\d+]/g, "");

export default async function ApplyPage() {
  const [s, home, contact] = await Promise.all([getSiteSettings(), getPage("home"), getPage("contact")]);
  const admissionsPhone = contact.departments.find((d) => d.name === "Admissions")?.phone || contact.phone || home.footer.phone;
  const grades = s.openGrades.length ? ALL_GRADES.filter((g) => s.openGrades.includes(g)) : ALL_GRADES.slice(0, 8);
  const years = [s.admissionsYear, s.admissionsYear + 1];
  const badge = home.badges.find((b) => b.name);

  const phoneLink = admissionsPhone ? (
    <a href={`tel:${tel(admissionsPhone)}`} className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary-ink underline underline-offset-4">
      <Phone className="size-5" aria-hidden /> {admissionsPhone}
    </a>
  ) : null;

  /* AP-03 closed state */
  if (!s.admissionPeriod) {
    return (
      <section className="section">
        <div className="container-page max-w-2xl text-center">
          <p className="eyebrow">Admissions</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admissions are currently closed</h1>
          <p className="mt-4 text-lg text-slate-700">
            Admissions for {s.admissionsYear} open on {s.admissionsOpenDate ? fmtLong(s.admissionsOpenDate) : "a date to be announced"}.
            In the meantime, we&apos;d love to show you around.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <Link href="/contact" className={buttonVariants({ variant: "accent" })}>Book a campus tour</Link>
            {phoneLink}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-primary text-primary-fg">
        <div className="container-page py-10 sm:py-12">
          <p className="text-sm font-bold uppercase tracking-wider text-accent-on-primary">Admissions {s.admissionsYear}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-primary-fg sm:text-4xl">Start your enquiry</h1>
          <p className="mt-2 max-w-xl text-lg opacity-95">It takes about two minutes. We&apos;ll take it from there.</p>
        </div>
      </section>
      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="card p-5 sm:p-8">
            <h2 className="sr-only">Admissions enquiry form</h2>
            <ApplyForm fields={s.formFields.slice(0, MAX_FORM_FIELDS)} grades={grades} years={years} replyDays={s.replyDays} />
          </div>
          <aside className="space-y-6">
            <div className="card p-5">
              <h2 className="mb-4 text-xl font-semibold">What happens next</h2>
              <ol className="space-y-4">
                {STEPS.map((st, i) => (
                  <li key={st.title} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-fg" aria-hidden>{i + 1}</span>
                    <div>
                      <p className="font-semibold">{st.title}</p>
                      <p className="text-slate-700">{st.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-5">
              <h2 className="mb-3 text-xl font-semibold">Documents you&apos;ll need later</h2>
              <ul className="space-y-2">
                {DOCUMENTS.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-slate-700">
                    <FileCheck2 className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden /> {d}
                  </li>
                ))}
              </ul>
            </div>
            {home.testimonial.quote && (
              <figure className="rounded-2xl bg-primary-soft p-5">
                <Quote className="size-6 text-accent-ink" aria-hidden />
                <blockquote className="mt-2 text-slate-800">“{home.testimonial.quote}”</blockquote>
                <figcaption className="mt-2 font-semibold">{home.testimonial.name}</figcaption>
              </figure>
            )}
            {badge && (
              <p className="flex items-center gap-3 font-semibold text-slate-800">
                <Award className="size-8 shrink-0 text-accent-ink" aria-hidden /> {badge.name} {badge.year}
              </p>
            )}
            {admissionsPhone && (
              <div>
                <p className="text-slate-700">Prefer to talk? Call admissions:</p>
                {phoneLink}
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
