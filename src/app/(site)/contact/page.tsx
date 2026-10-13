import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PreviewBanner } from "@/components/site/bits";
import { getPage } from "@/lib/content";
import { isPreview } from "@/lib/preview";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact Us" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const tel = (p: string) => p.replace(/[^\d+]/g, "");

export default async function ContactPage({ searchParams }: Props) {
  const preview = await isPreview(searchParams);
  const c = await getPage("contact", preview);
  const directions = c.directionsUrl || (c.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}` : "");

  return (
    <>
      {preview && <PreviewBanner />}
      <section className="bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Contact us</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">We&apos;d love to hear from you</h1>
        </div>
      </section>

      {/* CO-01 */}
      <section className="section pb-0">
        <ul className="container-page grid grid-cols-1 gap-4 md:grid-cols-3">
          <li className="card space-y-2 p-6">
            <Phone className="size-7 text-accent-ink" aria-hidden />
            <h2 className="text-xl font-semibold">Call the front office</h2>
            {c.phone ? (
              <a href={`tel:${tel(c.phone)}`} className="inline-flex min-h-12 items-center text-lg font-semibold text-primary-ink underline underline-offset-4">
                {c.phone}
              </a>
            ) : (
              <p className="text-slate-600">Number coming soon</p>
            )}
            <p className="flex items-center gap-2 text-slate-700">
              <Clock className="size-4" aria-hidden /> {c.officeHours}
            </p>
          </li>
          <li className="card space-y-2 p-6">
            <Mail className="size-7 text-accent-ink" aria-hidden />
            <h2 className="text-xl font-semibold">Email us</h2>
            {c.email ? (
              <a href={`mailto:${c.email}`} className="inline-flex min-h-12 items-center break-all text-lg font-semibold text-primary-ink underline underline-offset-4">
                {c.email}
              </a>
            ) : (
              <p className="text-slate-600">Email coming soon</p>
            )}
            <p className="text-slate-700">{c.replyTime}</p>
          </li>
          <li className="card space-y-2 p-6">
            <MapPin className="size-7 text-accent-ink" aria-hidden />
            <h2 className="text-xl font-semibold">Visit us</h2>
            <p className="whitespace-pre-line text-slate-700">{c.address || "Address coming soon"}</p>
            {directions && (
              <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center font-semibold text-primary-ink underline underline-offset-4">
                Get directions <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </li>
        </ul>
      </section>

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          {/* CO-02 */}
          <div className="card p-5 sm:p-8">
            <h2 className="h-section mb-6">Send us a message</h2>
            <ContactForm departments={c.departments.map((d) => d.name).filter(Boolean)} />
          </div>

          {/* CO-03 */}
          <div className="space-y-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-primary-soft">
              {c.mapEmbedUrl ? (
                <iframe
                  src={c.mapEmbedUrl}
                  title="Map showing the school's location"
                  className="aspect-[4/3] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center p-6 text-center text-slate-600">Map coming soon</div>
              )}
            </div>
            <div>
              <h2 className="mb-4 text-xl font-semibold">Department contacts</h2>
              <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
                {c.departments.map((d) => (
                  <li key={d.name} className="space-y-1 p-4">
                    <p className="font-semibold">{d.name}</p>
                    <div className="flex flex-wrap gap-x-5">
                      {d.email && (
                        <a href={`mailto:${d.email}`} className="inline-flex min-h-12 items-center break-all text-primary-ink underline underline-offset-4">{d.email}</a>
                      )}
                      {d.phone && (
                        <a href={`tel:${tel(d.phone)}`} className="inline-flex min-h-12 items-center text-primary-ink underline underline-offset-4">{d.phone}</a>
                      )}
                      {!d.email && !d.phone && <span className="text-slate-600">Details coming soon</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
