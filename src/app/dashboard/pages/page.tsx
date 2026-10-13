import Link from "next/link";
import { Eye } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getDraft, getSiteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { ImageField, JumpTo, PublishBar, Section, TF } from "@/components/dashboard/editor";
import { DocRows } from "@/components/dashboard/doc-rows";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { discardDraft, saveBranding, savePage } from "../_actions/pages";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = [
  { key: "home", label: "Home", preview: "/" },
  { key: "about", label: "About", preview: "/about" },
  { key: "contact", label: "Contact Us", preview: "/contact" },
  { key: "brand", label: "Branding", preview: "/" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

async function HomeEditor() {
  const { content: h, hasUnpublished } = await getDraft("home");
  const sections = [
    { id: "hero", label: "Hero banner" },
    { id: "stats", label: "School at a glance" },
    { id: "why", label: "Why families choose us" },
    { id: "gallery", label: "Latest from the Gallery" },
    { id: "events", label: "Upcoming events" },
    { id: "trust", label: "Testimonial & badges" },
    { id: "footer", label: "Footer" },
  ];
  return (
    <form action={savePage}>
      <input type="hidden" name="page" value="home" />
      <JumpTo items={sections} />
      <div className="space-y-6">
        <Section n={1} id="hero" title="Hero banner">
          <TF name="hero.label" label="Small label" value={h.hero.label} hint="Shown while admissions are open. When closed, the site shows the opening date instead." />
          <TF name="hero.headline" label="Headline" value={h.hero.headline} required />
          <TF name="hero.intro" label="One-sentence introduction" value={h.hero.intro} textarea rows={2} />
          <ImageField name="hero.image" label="Hero photo" current={h.hero.imageUrl} />
          <TF name="hero.imageAlt" label="Hero photo description (alt text)" value={h.hero.imageAlt} />
        </Section>

        <Section n={2} id="stats" title="School at a glance">
          <div className="grid gap-5 md:grid-cols-3">
            <TF name="stats.passRate" label="Overall pass rate (%)" value={h.stats.passRate} inputMode="decimal" />
            <TF name="stats.learners" label="Learners enrolled" value={h.stats.learners} inputMode="numeric" />
            <TF name="stats.teachers" label="Number of teachers" value={h.stats.teachers} inputMode="numeric" />
            <TF name="stats.grades" label="Grades offered" value={h.stats.grades} hint="e.g. R–7" />
            <TF name="stats.foundingYear" label="Year founded" value={h.stats.foundingYear} type="number" inputMode="numeric" hint="“Years serving” is worked out from this each year." />
          </div>
        </Section>

        <Section n={3} id="why" title="Why families choose us">
          <TF name="why.heading" label="Heading" value={h.why.heading} />
          <TF name="why.body" label="2–3 sentences" value={h.why.body} textarea />
        </Section>

        <Section n={4} id="gallery" title="Latest from the Gallery" auto={{ href: "/dashboard/gallery", label: "Go to Gallery", text: "Shows the newest photo set from the 3 most recently updated albums." }} />
        <Section n={5} id="events" title="Upcoming events" auto={{ href: "/dashboard/events", label: "Go to Calendar events", text: "Shows the next 3 public events from the school calendar." }} />

        <Section n={6} id="trust" title="Parent testimonial & badges">
          <TF name="testimonial.quote" label="Parent quote" value={h.testimonial.quote} textarea />
          <div className="grid gap-5 md:grid-cols-2">
            <TF name="testimonial.name" label="Parent's name" value={h.testimonial.name} />
            <TF name="testimonial.grade" label="Child's grade" value={h.testimonial.grade} hint="e.g. Grade 4" />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {h.badges.map((b, i) => (
              <fieldset key={i} className="space-y-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 font-semibold">Badge {i + 1}</legend>
                <ImageField name={`badge${i}.logo`} label="Logo" current={b.logoUrl} hint="Optional — the standard badge icon shows if empty." />
                <TF name={`badge${i}.name`} label="Display name" value={b.name} required />
                <TF name={`badge${i}.year`} label="Year" value={b.year} required inputMode="numeric" />
              </fieldset>
            ))}
          </div>
          <p className="text-sm text-slate-600">These badges also appear as “Latest awards” on the About page.</p>
        </Section>

        <Section n={7} id="footer" title="Footer">
          <div className="grid gap-5 md:grid-cols-2">
            <TF name="footer.address" label="Street address" value={h.footer.address} />
            <TF name="footer.city" label="City" value={h.footer.city} />
            <TF name="footer.phone" label="Front-office phone" value={h.footer.phone} type="tel" inputMode="tel" />
            <TF name="footer.facebook" label="Facebook page" value={h.footer.facebook} type="url" hint="https://…" />
            <TF name="footer.instagram" label="Instagram profile" value={h.footer.instagram} type="url" hint="https://…" />
            <TF name="footer.youtube" label="YouTube channel" value={h.footer.youtube} type="url" hint="https://…" />
          </div>
        </Section>
      </div>
      <PublishBar hasDraft={hasUnpublished} />
    </form>
  );
}

async function AboutEditor() {
  const { content: a, hasUnpublished } = await getDraft("about");
  const sections = [
    { id: "intro", label: "Page introduction" },
    { id: "story", label: "Our story" },
    { id: "mvv", label: "Mission, vision & values" },
    { id: "leaders", label: "Leadership" },
    { id: "docs", label: "Documents" },
    { id: "awards", label: "Latest awards" },
  ];
  return (
    <form action={savePage}>
      <input type="hidden" name="page" value="about" />
      <JumpTo items={sections} />
      <div className="space-y-6">
        <Section n={1} id="intro" title="Page introduction">
          <TF name="intro" label="Introduction line" value={a.intro} textarea rows={2} />
        </Section>
        <Section n={2} id="story" title="Our story">
          <TF name="story.text" label="Story" value={a.story.text} textarea rows={8} hint="Leave a blank line between paragraphs." />
          <ImageField name="story.image" label="Photo" current={a.story.imageUrl} />
          <TF name="story.imageAlt" label="Photo description (alt text)" value={a.story.imageAlt} />
        </Section>
        <Section n={3} id="mvv" title="Mission, vision & values">
          <div className="grid gap-5 md:grid-cols-3">
            <TF name="mission" label="Mission" value={a.mission} textarea rows={5} />
            <TF name="vision" label="Vision" value={a.vision} textarea rows={5} />
            <TF name="values" label="Values" value={a.values} textarea rows={5} />
          </div>
        </Section>
        <Section n={4} id="leaders" title="Leadership">
          <div className="grid gap-4 xl:grid-cols-3">
            {a.leaders.map((l, i) => (
              <fieldset key={l.role} className="space-y-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 font-semibold">{l.role}</legend>
                <ImageField name={`leader${i}.photo`} label="Headshot" current={l.photoUrl} round />
                <TF name={`leader${i}.name`} label="Full name" value={l.name} required />
                <TF name={`leader${i}.qualifications`} label="Qualifications" value={l.qualifications} />
              </fieldset>
            ))}
          </div>
          <TF name="staffDirectoryUrl" label="“Full staff directory” link" value={a.staffDirectoryUrl} hint="A page on this site (e.g. /contact) or an https:// link." />
        </Section>
        <Section n={5} id="docs" title="Accreditation & policy documents">
          <DocRows docs={a.documents} />
        </Section>
        <Section n={6} id="awards" title="Latest awards" auto={{ href: "/dashboard/pages?tab=home#trust", label: "Edit badges on the Home tab", text: "Copied from the three badges on the Home page." }} />
      </div>
      <PublishBar hasDraft={hasUnpublished} />
    </form>
  );
}

async function ContactEditor() {
  const { content: c, hasUnpublished } = await getDraft("contact");
  return (
    <form action={savePage}>
      <input type="hidden" name="page" value="contact" />
      <JumpTo items={[{ id: "details", label: "Contact details" }, { id: "address", label: "Address & map" }, { id: "depts", label: "Department contacts" }]} />
      <div className="space-y-6">
        <Section n={1} id="details" title="Contact details">
          <div className="grid gap-5 md:grid-cols-2">
            <TF name="phone" label="Front-office phone" value={c.phone} type="tel" inputMode="tel" />
            <TF name="officeHours" label="Office hours" value={c.officeHours} />
            <TF name="email" label="Email" value={c.email} type="email" />
            <TF name="replyTime" label="Reply time" value={c.replyTime} />
          </div>
        </Section>
        <Section n={2} id="address" title="Address & map">
          <TF name="address" label="Address" value={c.address} textarea rows={3} />
          <TF name="directionsUrl" label="“Get directions” link" value={c.directionsUrl} type="url" hint="Optional. If empty, a Google Maps link is made from the address." />
          <TF name="mapEmbedUrl" label="Map embed" value={c.mapEmbedUrl} hint="In Google Maps choose Share → Embed a map, then paste the code or its link here." />
        </Section>
        <Section n={3} id="depts" title="Department contacts">
          <div className="grid gap-4 md:grid-cols-2">
            {c.departments.map((d, i) => (
              <fieldset key={d.name} className="space-y-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 font-semibold">{d.name}</legend>
                <TF name={`dept${i}.email`} label="Email" value={d.email} type="email" />
                <TF name={`dept${i}.phone`} label="Phone" value={d.phone} type="tel" inputMode="tel" />
              </fieldset>
            ))}
          </div>
        </Section>
      </div>
      <PublishBar hasDraft={hasUnpublished} />
    </form>
  );
}

async function BrandEditor() {
  const s = await getSiteSettings();
  return (
    <Panel title="School name, logo and colours" id="brand">
      <form action={saveBranding} className="space-y-5">
        <TF name="schoolName" label="School name" value={s.schoolName} required />
        <ImageField name="logo" label="Logo" current={s.logoUrl} hint="Square PNG works best. If empty, a graduation-cap icon is used." />
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { name: "primaryColor", label: "Primary colour", v: s.primaryColor },
            { name: "accentColor", label: "Highlight colour", v: s.accentColor },
          ].map((c) => (
            <Field key={c.name} label={c.label} htmlFor={c.name} required hint="Hex value, e.g. #0B1F3A. Text shades are adjusted automatically for readability.">
              <div className="flex items-center gap-3">
                <span className="size-12 shrink-0 rounded-xl border border-slate-300" style={{ background: c.v }} aria-hidden />
                <Input id={c.name} name={c.name} defaultValue={c.v} pattern="#[0-9A-Fa-f]{6}" spellCheck={false} />
              </div>
            </Field>
          ))}
        </div>
        <p className="text-sm text-slate-600">Branding changes go live as soon as you save.</p>
        <Button type="submit">Save branding</Button>
      </form>
    </Panel>
  );
}

export default async function PagesEditor({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: TabKey = (TABS.find((t) => t.key === sp.tab)?.key ?? "home") as TabKey;
  const current = TABS.find((t) => t.key === tab)!;
  const { hasUnpublished } = tab === "brand" ? { hasUnpublished: false } : await getDraft(tab);

  return (
    <>
      <PageTitle title="Website pages" intro="Edit each page from top to bottom. Drafts stay private until you publish.">
        {tab !== "brand" && (
          <div className="flex flex-wrap gap-2">
            {hasUnpublished && (
              <form action={discardDraft}>
                <input type="hidden" name="page" value={tab} />
                <Button type="submit" variant="dangerGhost" size="sm">Discard draft</Button>
              </form>
            )}
            <Link href={`${current.preview}?preview=1`} target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Eye aria-hidden /> Preview this page
            </Link>
          </div>
        )}
      </PageTitle>
      <nav aria-label="Pages" className="mb-6 overflow-x-auto">
        <ul className="flex min-w-max gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <li key={t.key}>
              <Link
                href={`/dashboard/pages?tab=${t.key}`}
                aria-current={t.key === tab ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center border-b-[3px] px-4 font-semibold",
                  t.key === tab ? "border-accent text-primary-ink" : "border-transparent text-slate-600 hover:text-primary-ink",
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {tab === "home" && <HomeEditor />}
      {tab === "about" && <AboutEditor />}
      {tab === "contact" && <ContactEditor />}
      {tab === "brand" && <BrandEditor />}
    </>
  );
}
