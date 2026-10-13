"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { done } from "@/lib/flash";
import { str } from "@/lib/utils";
import { hasFile, saveUpload, UploadError } from "@/lib/storage";
import { isHex, normalizeHex } from "@/lib/colors";
import type { AboutContent, Badge, ContactContent, HomeContent, Leader, PageKey, PolicyDoc } from "@/lib/content";

/** Image field: keep the current URL, replace it with a new upload, or clear it. */
async function image(fd: FormData, name: string, folder: string): Promise<string> {
  if (fd.get(`${name}__remove`) === "on") return "";
  const f = fd.get(`${name}__file`);
  if (hasFile(f)) return saveUpload(f, folder, "image");
  return str(fd.get(`${name}__current`));
}

async function buildHome(fd: FormData): Promise<HomeContent> {
  const badges = [] as unknown as HomeContent["badges"];
  for (let i = 0; i < 3; i++) {
    const b: Badge = { name: str(fd.get(`badge${i}.name`)), year: str(fd.get(`badge${i}.year`)), logoUrl: await image(fd, `badge${i}.logo`, "badges") };
    badges.push(b);
  }
  return {
    hero: {
      label: str(fd.get("hero.label")),
      headline: str(fd.get("hero.headline")),
      intro: str(fd.get("hero.intro")),
      imageUrl: await image(fd, "hero.image", "home"),
      imageAlt: str(fd.get("hero.imageAlt")),
    },
    stats: {
      passRate: str(fd.get("stats.passRate")).replace("%", ""),
      learners: str(fd.get("stats.learners")),
      teachers: str(fd.get("stats.teachers")),
      grades: str(fd.get("stats.grades")),
      foundingYear: str(fd.get("stats.foundingYear")),
    },
    why: { heading: str(fd.get("why.heading")), body: str(fd.get("why.body")) },
    testimonial: { quote: str(fd.get("testimonial.quote")), name: str(fd.get("testimonial.name")), grade: str(fd.get("testimonial.grade")) },
    badges,
    footer: {
      address: str(fd.get("footer.address")),
      city: str(fd.get("footer.city")),
      phone: str(fd.get("footer.phone")),
      facebook: str(fd.get("footer.facebook")),
      instagram: str(fd.get("footer.instagram")),
      youtube: str(fd.get("footer.youtube")),
    },
  };
}

async function buildAbout(fd: FormData): Promise<AboutContent> {
  const roles = ["Principal", "Deputy principal", "Chair of the governing body"];
  const leaders = [] as unknown as AboutContent["leaders"];
  for (let i = 0; i < 3; i++) {
    const l: Leader = {
      role: roles[i],
      name: str(fd.get(`leader${i}.name`)),
      qualifications: str(fd.get(`leader${i}.qualifications`)),
      photoUrl: await image(fd, `leader${i}.photo`, "leaders"),
    };
    leaders.push(l);
  }
  const documents: PolicyDoc[] = [];
  const count = Number(fd.get("doc.count")) || 0;
  for (let i = 0; i < count; i++) {
    if (fd.get(`doc${i}.remove`) === "on") continue;
    const name = str(fd.get(`doc${i}.name`));
    const file = fd.get(`doc${i}.file`);
    let url = str(fd.get(`doc${i}.url`));
    if (hasFile(file)) url = await saveUpload(file, "documents", "pdf");
    if (!name && !url) continue; // empty "add another" row
    documents.push({ name, url });
  }
  return {
    intro: str(fd.get("intro")),
    story: { text: str(fd.get("story.text")), imageUrl: await image(fd, "story.image", "about"), imageAlt: str(fd.get("story.imageAlt")) },
    mission: str(fd.get("mission")),
    vision: str(fd.get("vision")),
    values: str(fd.get("values")),
    leaders,
    staffDirectoryUrl: str(fd.get("staffDirectoryUrl")) || "/contact",
    documents,
  };
}

function buildContact(fd: FormData): ContactContent {
  const names = ["Admissions", "Accounts & fees", "Sport coordinator", "Learner support"];
  return {
    phone: str(fd.get("phone")),
    officeHours: str(fd.get("officeHours")),
    email: str(fd.get("email")),
    replyTime: str(fd.get("replyTime")),
    address: str(fd.get("address")),
    directionsUrl: str(fd.get("directionsUrl")),
    mapEmbedUrl: safeEmbed(str(fd.get("mapEmbedUrl"))),
    departments: names.map((name, i) => ({ name, email: str(fd.get(`dept${i}.email`)), phone: str(fd.get(`dept${i}.phone`)) })),
  };
}

/** Accept a pasted Google Maps embed URL or the whole <iframe> snippet; only https URLs are kept. */
function safeEmbed(v: string) {
  const m = v.match(/src="([^"]+)"/);
  const url = m ? m[1] : v;
  try {
    return new URL(url).protocol === "https:" ? url : "";
  } catch {
    return "";
  }
}

const URLISH = (v: string) => !v || /^https:\/\//.test(v);

function publishProblems(page: PageKey, c: HomeContent | AboutContent | ContactContent): string | null {
  if (page === "home") {
    const h = c as HomeContent;
    if (!h.hero.headline) return "The hero needs a headline.";
    if (h.hero.imageUrl && !h.hero.imageAlt) return "Describe the hero photo (alt text).";
    for (let i = 0; i < 3; i++) if (!h.badges[i].name || !h.badges[i].year) return `Badge ${i + 1} needs a display name and a year.`;
    const fy = h.stats.foundingYear;
    if (fy && !/^\d{4}$/.test(fy)) return "Year founded must be a 4-digit year.";
    if (![h.footer.facebook, h.footer.instagram, h.footer.youtube].every(URLISH)) return "Social links must start with https://";
  }
  if (page === "about") {
    const a = c as AboutContent;
    for (const l of a.leaders) if (!l.name) return `Enter the full name of the ${l.role.toLowerCase()}.`;
    for (const d of a.documents) if (!d.name || !d.url) return "Each document needs a display name and a PDF.";
  }
  if (page === "contact") {
    const ct = c as ContactContent;
    if (!URLISH(ct.directionsUrl)) return "The directions link must start with https://";
  }
  return null;
}

export async function savePage(fd: FormData) {
  const u = await requireAdmin();
  const page = str(fd.get("page")) as PageKey;
  if (!["home", "about", "contact"].includes(page)) done("/dashboard/pages", "Unknown page.", "error");
  const back = `/dashboard/pages?tab=${page}`;
  const publish = str(fd.get("intent")) === "publish";

  let content: HomeContent | AboutContent | ContactContent;
  try {
    content = page === "home" ? await buildHome(fd) : page === "about" ? await buildAbout(fd) : buildContact(fd);
  } catch (e) {
    if (e instanceof UploadError) done(back, e.message, "error");
    throw e;
  }

  if (publish) {
    const problem = publishProblems(page, content);
    if (problem) {
      // Keep the work as a draft so nothing typed is lost.
      await db
        .insert(schema.pageContent)
        .values({ page, draft: content })
        .onConflictDoUpdate({ target: schema.pageContent.page, set: { draft: content, updatedAt: new Date() } });
      done(back, `Saved as a draft but not published: ${problem}`, "error");
    }
    const now = new Date();
    await db
      .insert(schema.pageContent)
      .values({ page, published: content, draft: null, publishedAt: now })
      .onConflictDoUpdate({ target: schema.pageContent.page, set: { published: content, draft: null, publishedAt: now, updatedAt: now } });
  } else {
    await db
      .insert(schema.pageContent)
      .values({ page, draft: content })
      .onConflictDoUpdate({ target: schema.pageContent.page, set: { draft: content, updatedAt: new Date() } });
  }
  const label = page === "home" ? "Home" : page === "about" ? "About" : "Contact Us";
  await logActivity(u.name, publish ? `published the ${label} page` : `saved a draft of the ${label} page`);
  done(back, publish ? `${label} page published — it's live now.` : `${label} draft saved. It isn't visible on the website until you publish.`);
}

export async function discardDraft(fd: FormData) {
  const u = await requireAdmin();
  const page = str(fd.get("page")) as PageKey;
  await db.update(schema.pageContent).set({ draft: null }).where(eq(schema.pageContent.page, page));
  await logActivity(u.name, `discarded the ${page} page draft`);
  done(`/dashboard/pages?tab=${page}`, "Draft discarded.");
}

export async function saveBranding(fd: FormData) {
  const u = await requireAdmin();
  const back = "/dashboard/pages?tab=brand";
  const schoolName = str(fd.get("schoolName"));
  const primary = normalizeHex(str(fd.get("primaryColor")), "");
  const accent = normalizeHex(str(fd.get("accentColor")), "");
  if (schoolName.length < 2) done(back, "Enter the school's name.", "error");
  if (!isHex(primary) || !isHex(accent)) done(back, "Colours must be hex values like #0B1F3A.", "error");
  let logoUrl: string;
  try {
    logoUrl = await image(fd, "logo", "brand");
  } catch (e) {
    if (e instanceof UploadError) done(back, e.message, "error");
    throw e;
  }
  await db
    .update(schema.settings)
    .set({ schoolName, primaryColor: primary, accentColor: accent, logoUrl: logoUrl || null, updatedAt: new Date() })
    .where(eq(schema.settings.id, 1));
  await logActivity(u.name, "updated the school name, logo and colours");
  done(back, "Branding saved — the website uses the new name and colours now.");
}
