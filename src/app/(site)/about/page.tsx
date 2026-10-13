import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Eye, FileText, Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badges, Headshot, Photo, PreviewBanner } from "@/components/site/bits";
import { getPage, getSiteSettings } from "@/lib/content";
import { isPreview } from "@/lib/preview";

export const metadata: Metadata = { title: "About" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-plain text-lg text-slate-700">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export default async function AboutPage({ searchParams }: Props) {
  const preview = await isPreview(searchParams);
  const [s, about, home] = await Promise.all([getSiteSettings(), getPage("about", preview), getPage("home", preview)]);
  const mvv = [
    { title: "Mission", text: about.mission, icon: Compass },
    { title: "Vision", text: about.vision, icon: Eye },
    { title: "Values", text: about.values, icon: Heart },
  ];

  return (
    <>
      {preview && <PreviewBanner />}
      <section className="bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">About us</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">About {s.schoolName}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">{about.intro}</p>
        </div>
      </section>

      {/* AB-01 */}
      <section className="section">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="h-section mb-4">Our story</h2>
            {about.story.text ? <Paragraphs text={about.story.text} /> : <p className="text-slate-600">Our story is coming soon.</p>}
          </div>
          <Photo src={about.story.imageUrl} alt={about.story.imageAlt} sizes="(max-width: 1024px) 100vw, 50vw" className="aspect-[4/3]" />
        </div>
      </section>

      {/* AB-02 */}
      <section className="section bg-slate-50" aria-labelledby="mvv">
        <div className="container-page">
          <h2 id="mvv" className="h-section mb-8">Mission, vision and values</h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {mvv.map(({ title, text, icon: Icon }) => (
              <li key={title} className="card p-6">
                <Icon className="size-7 text-accent-ink" aria-hidden />
                <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                <p className="mt-2 whitespace-pre-line text-slate-700">{text || "Coming soon."}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AB-03 */}
      <section className="section" aria-labelledby="leadership">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="leadership" className="h-section">Leadership</h2>
            <Link href={about.staffDirectoryUrl || "/contact"} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Full staff directory →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {about.leaders.map((l) => (
              <li key={l.role} className="card flex items-center gap-4 p-5">
                <Headshot src={l.photoUrl} name={l.name} />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{l.name || "To be announced"}</h3>
                  <p className="font-semibold text-accent-ink">{l.role}</p>
                  {l.qualifications && <p className="text-sm text-slate-600">{l.qualifications}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AB-04 + AB-05 */}
      <section className="section bg-slate-50">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="h-section mb-6">Accreditation and policy documents</h2>
            {about.documents.length ? (
              <ul className="space-y-2">
                {about.documents.map((d, i) => (
                  <li key={i}>
                    <a href={d.url} target="_blank" rel="noopener" className="card flex min-h-14 items-center gap-3 px-4 py-3 font-semibold text-primary-ink hover:bg-primary-soft">
                      <FileText className="size-5 shrink-0 text-accent-ink" aria-hidden />
                      {d.name} (PDF)
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-600">Documents will be published here.</p>
            )}
          </div>
          <div>
            <h2 className="h-section mb-6">Latest awards</h2>
            <Badges badges={home.badges} />
          </div>
        </div>
      </section>

      {/* AB-06 */}
      <section className="bg-primary text-primary-fg">
        <div className="container-page flex flex-col items-start gap-5 py-12 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-primary-fg sm:text-3xl">Ready to join our community?</h2>
          {s.admissionPeriod ? (
            <Link href="/apply" className={buttonVariants({ variant: "accent" })}>Apply Now</Link>
          ) : (
            <Link href="/contact" className={buttonVariants({ variant: "accent" })}>Book a campus tour</Link>
          )}
        </div>
      </section>
    </>
  );
}
