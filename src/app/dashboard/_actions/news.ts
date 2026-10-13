"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { done } from "@/lib/flash";
import { str } from "@/lib/utils";
import { hasFile, saveUpload, UploadError } from "@/lib/storage";
import { POST_CATEGORIES } from "@/lib/event-types";

export async function savePost(fd: FormData) {
  const u = await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const title = str(fd.get("title"));
  const category = str(fd.get("category"));
  const body = str(fd.get("body"));
  const publish = str(fd.get("intent")) === "publish";
  const editPath = id ? `/dashboard/news?edit=${id}` : "/dashboard/news?new=1";
  if (!title) done(editPath, "Add a title.", "error");
  if (!(POST_CATEGORIES as readonly string[]).includes(category)) done(editPath, "Choose a category.", "error");

  let coverUrl: string | undefined;
  const cover = fd.get("cover");
  if (hasFile(cover)) {
    try {
      coverUrl = await saveUpload(cover, "news");
    } catch (e) {
      if (e instanceof UploadError) done(editPath, e.message, "error");
      throw e;
    }
  }

  const now = new Date();
  const status = publish ? "published" : "draft";
  if (id) {
    const [existing] = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    if (!existing) done("/dashboard/news", "That post no longer exists.", "error");
    await db
      .update(schema.posts)
      .set({
        title,
        category,
        body,
        status,
        updatedAt: now,
        ...(coverUrl ? { coverUrl } : {}),
        publishedAt: publish ? (existing.publishedAt ?? now) : existing.publishedAt,
      })
      .where(eq(schema.posts.id, id));
  } else {
    await db.insert(schema.posts).values({ title, category, body, status, coverUrl: coverUrl ?? null, publishedAt: publish ? now : null });
  }
  await logActivity(u.name, `${publish ? "published" : "saved a draft of"} the news post “${title}”`);
  done("/dashboard/news", publish ? `“${title}” is published.` : `“${title}” saved as a draft.`);
}

export async function deletePost(fd: FormData) {
  const u = await requireAdmin();
  const [p] = await db.delete(schema.posts).where(eq(schema.posts.id, Number(fd.get("id")))).returning();
  if (!p) done("/dashboard/news", "That post was already deleted.", "error");
  await logActivity(u.name, `deleted the news post “${p.title}”`);
  done("/dashboard/news", `“${p.title}” deleted.`);
}
