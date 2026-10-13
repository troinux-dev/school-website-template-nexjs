"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { done } from "@/lib/flash";
import { str } from "@/lib/utils";
import { hasFile, saveUpload, UploadError } from "@/lib/storage";
import { GALLERY_CATEGORIES } from "@/lib/event-types";

export async function uploadPhotos(fd: FormData) {
  const u = await requireUser();
  const category = str(fd.get("category"));
  const title = str(fd.get("caption"));
  const eventDate = str(fd.get("eventDate"));
  const alt = str(fd.get("alt"));
  const files = fd.getAll("photos").filter(hasFile);
  const back = "/dashboard/gallery";
  if (!(GALLERY_CATEGORIES as readonly string[]).includes(category)) done(back, "Choose an album.", "error");
  if (!title) done(back, "Add a caption.", "error");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) done(back, "Choose the event date.", "error");
  if (!files.length) done(back, "Choose at least one photo.", "error");
  if (files.length > 40) done(back, "Upload up to 40 photos at a time.", "error");

  let urls: string[];
  try {
    urls = await Promise.all(files.map((f) => saveUpload(f, `gallery/${category.toLowerCase()}`)));
  } catch (e) {
    if (e instanceof UploadError) done(back, e.message, "error");
    throw e;
  }
  const [set] = await db.insert(schema.photoSets).values({ category, title, eventDate, createdBy: u.name }).returning();
  await db.insert(schema.photos).values(urls.map((url, i) => ({ setId: set.id, url, alt: alt || `${title}${urls.length > 1 ? ` — photo ${i + 1}` : ""}` })));
  await logActivity(u.name, `uploaded ${urls.length} photo${urls.length === 1 ? "" : "s"} to ${category}`);
  done(back, `${urls.length} photo${urls.length === 1 ? "" : "s"} uploaded to ${category}.`);
}

export async function removePhoto(fd: FormData) {
  const u = await requireUser();
  const id = Number(fd.get("id"));
  const [p] = await db.select().from(schema.photos).where(eq(schema.photos.id, id)).limit(1);
  if (!p) done("/dashboard/gallery", "That photo was already removed.", "error");
  await db.delete(schema.photos).where(eq(schema.photos.id, id));
  const rest = await db.select({ id: schema.photos.id }).from(schema.photos).where(eq(schema.photos.setId, p.setId)).limit(1);
  if (!rest.length) await db.delete(schema.photoSets).where(eq(schema.photoSets.id, p.setId));
  await logActivity(u.name, `removed a photo (${p.alt})`);
  done("/dashboard/gallery", "Photo removed from the gallery.");
}
