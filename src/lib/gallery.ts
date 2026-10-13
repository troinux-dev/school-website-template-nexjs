import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type GalleryCard = {
  setId: number;
  category: string;
  title: string;
  eventDate: string;
  count: number;
  coverUrl: string;
  coverAlt: string;
};

/** HM-04: the newest photo set from each of the 3 most recently updated categories. */
export async function latestByCategory(): Promise<GalleryCard[]> {
  const sets = await db
    .select()
    .from(schema.photoSets)
    .orderBy(desc(schema.photoSets.createdAt), desc(schema.photoSets.id))
    .limit(200);
  const picked: typeof sets = [];
  const seen = new Set<string>();
  for (const s of sets) {
    if (seen.has(s.category)) continue;
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.photos)
      .where(eq(schema.photos.setId, s.id));
    if (!n) continue; // a set whose photos were all removed doesn't count
    seen.add(s.category);
    picked.push(s);
    if (picked.length === 3) break;
  }
  if (!picked.length) return [];
  const ids = picked.map((s) => s.id);
  const rows = await db
    .select({ setId: schema.photos.setId, url: schema.photos.url, alt: schema.photos.alt, id: schema.photos.id })
    .from(schema.photos)
    .where(inArray(schema.photos.setId, ids))
    .orderBy(schema.photos.id);
  return picked.map((s) => {
    const mine = rows.filter((r) => r.setId === s.id);
    return {
      setId: s.id,
      category: s.category,
      title: s.title,
      eventDate: s.eventDate,
      count: mine.length,
      coverUrl: mine[0]?.url ?? "",
      coverAlt: mine[0]?.alt ?? s.title,
    };
  });
}

export type GalleryPhoto = {
  id: number;
  url: string;
  alt: string;
  category: string;
  title: string;
  eventDate: string;
};

export const GALLERY_PAGE_SIZE = 12;

export async function galleryPage(category: string | undefined, offset: number, limit = GALLERY_PAGE_SIZE) {
  const where = category ? eq(schema.photoSets.category, category) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.photos.id,
        url: schema.photos.url,
        alt: schema.photos.alt,
        category: schema.photoSets.category,
        title: schema.photoSets.title,
        eventDate: schema.photoSets.eventDate,
      })
      .from(schema.photos)
      .innerJoin(schema.photoSets, eq(schema.photos.setId, schema.photoSets.id))
      .where(and(where))
      .orderBy(desc(schema.photoSets.eventDate), desc(schema.photos.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.photos)
      .innerJoin(schema.photoSets, eq(schema.photos.setId, schema.photoSets.id))
      .where(and(where)),
  ]);
  return { items: items as GalleryPhoto[], total };
}
