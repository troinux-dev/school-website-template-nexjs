import Link from "next/link";
import { BookOpen, CalendarClock, GraduationCap, Percent, Quote, Users, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badges, DateBlock, Photo, PreviewBanner, SectionHeader, TypePill } from "@/components/site/bits";
import { getPage, getSiteSettings } from "@/lib/content";
import { latestByCategory } from "@/lib/gallery";
import { eventWhen, upcomingEvents } from "@/lib/events";
import { currentYear, fmtLong } from "@/lib/dates";
import { isPreview } from "@/lib/preview";
import { admissionsClosedLabel } from "@/lib/admissions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Stat({ icon: Icon, value, label, sub }: { icon: typeof Users; value: string; label: string; sub?: string }) {
  return (
    <li className="card flex flex-col gap-2 p-5">
      <Icon className="size-6 text-accent-ink" aria-hidden />
      <p className="font-heading text-3xl font-semibold text-primary-ink">{value || "—"}</p>
      <p className="font-semibold text-slate-800">{label}</p>
      {sub && <p className="text-sm text-slate-600">{sub}</p>}
    </li>
  );
}

export default async function HomePage({ searchParams }: Props) {
  const preview = await isPreview(searchParams);
  const [s, home, cards, events] = await Promise.all([
    getSiteSettings(),
    getPage("home", preview),
    latestByCategory(),
    upcomingEvents({ limit: 3 }),
  ]);

  const founding = Number(home.stats.foundingYear);
  const now = currentYear();
  const validFounding = Number.isInteger(founding) && founding > 1700 && founding <= now;
  const years = validFounding ? String(now - founding) : "";

  return (
    <>
      {preview && <PreviewBanner />}

      {/* HM-01 Hero */}
      <section className="bg-primary text-primary-fg">
        <div className="container-page grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-wider text-accent-on-primary">
              {s.admissionPeriod ? home.hero.label : admissionsClosedLabel(s.admissionsYear, s.admissionsOpenDate)}
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-primary-fg sm:text-4xl lg:text-5xl">{home.hero.headline}</h1>
            <p className="max-w-xl text-lg opacity-95">{home.hero.intro}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/portal" className={buttonVariants({ variant: "outlineLight" })}>
                <UserRound aria-hidden /> Portal
              </Link>
              {s.admissionPeriod ? (
                <Link href="/apply" className={buttonVariants({ variant: "accent" })}>
                  Apply Now
                </Link>
              ) : (
                <Link href="/contact" className={buttonVariants({ variant: "accent" })}>
                  Book a campus tour
                </Link>
              )}
            </div>
          </div>
          <Photo
            src={home.hero.imageUrl}
            alt={home.hero.imageAlt}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/3] w-full sm:aspect-[16/10]"
            priority
          />
        </div>
      </section>

      {/* HM-02 Stats */}
      <section aria-labelledby="glance" className="section bg-slate-50">
        <div className="container-page">
          <h2 id="glance" className="sr-only">School at a glance</h2>
          <ul className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 lg:grid-cols-5">
            <Stat icon={Percent} value={home.stats.passRate ? `${home.stats.passRate}%` : ""} label="Overall pass rate" />
            <Stat icon={Users} value={home.stats.learners} label="Learners enrolled" />
            <Stat icon={BookOpen} value={home.stats.teachers} label="Teachers" />
            <Stat icon={GraduationCap} value={home.stats.grades} label="Grades offered" />
            <Stat
              icon={CalendarClock}
              value={years}
              label="Years serving the community"
              sub={validFounding ? `Since ${founding}` : "Founding year coming soon"}
            />
          </ul>
        </div>
      </section>

      {/* HM-03 */}
      <section className="section">
        <div className="container-page max-w-3xl text-center">
          <h2 className="h-section">{home.why.heading}</h2>
          <p className="mt-4 text-lg text-slate-700">{home.why.body}</p>
        </div>
      </section>

      {/* HM-04 Gallery */}
      <section className="section bg-slate-50" aria-labelledby="latest-gallery">
        <div className="container-page">
          <div id="latest-gallery">
            <SectionHeader eyebrow="Gallery" title="Latest from the Gallery" action={{ href: "/gallery", label: "View gallery" }} />
          </div>
          {cards.length ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {cards.map((c) => (
                <li key={c.setId}>
                  <Link href={`/gallery?category=${encodeURIComponent(c.category)}`} className="card group block overflow-hidden">
                    <Photo src={c.coverUrl} alt={c.coverAlt} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[4/3]" rounded="rounded-none" />
                    <div className="space-y-1 p-5">
                      <p className="text-sm font-bold uppercase tracking-wider text-accent-ink">{c.category}</p>
                      <h3 className="text-lg font-semibold group-hover:underline">{c.title}</h3>
                      <p className="text-sm text-slate-600">
                        {fmtLong(c.eventDate)} · {c.count} photo{c.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">Photos will appear here soon.</p>
          )}
        </div>
      </section>

      {/* HM-05 Events */}
      <section className="section" aria-labelledby="upcoming">
        <div className="container-page">
          <div id="upcoming">
            <SectionHeader eyebrow="Calendar" title="Upcoming events" action={{ href: "/calendar", label: "View full calendar" }} />
          </div>
          {events.length ? (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {events.map((e) => (
                <li key={e.id} className="card flex gap-4 p-5">
                  <DateBlock date={e.startDate} type={e.type} />
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="text-sm text-slate-700">{eventWhen(e)}</p>
                    <TypePill type={e.type} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No upcoming events right now.</p>
          )}
        </div>
      </section>

      {/* HM-06 Testimonial and badges */}
      <section className="section bg-slate-50" aria-labelledby="trust">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <h2 id="trust" className="sr-only">What parents say and our awards</h2>
          {home.testimonial.quote ? (
            <figure className="card p-6 sm:p-8">
              <Quote className="size-8 text-accent-ink" aria-hidden />
              <blockquote className="mt-3 text-lg text-slate-800">“{home.testimonial.quote}”</blockquote>
              <figcaption className="mt-4 font-semibold text-slate-900">
                {home.testimonial.name}
                {home.testimonial.grade && <span className="font-normal text-slate-600"> · Parent, {home.testimonial.grade}</span>}
              </figcaption>
            </figure>
          ) : (
            <div />
          )}
          <Badges badges={home.badges} />
        </div>
      </section>
    </>
  );
}
