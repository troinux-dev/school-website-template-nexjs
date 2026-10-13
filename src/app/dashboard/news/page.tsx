import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { PenSquare, Plus, Trash2 } from "lucide-react";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { POST_CATEGORIES } from "@/lib/event-types";
import { PageTitle, Panel, StatusPill } from "@/components/dashboard/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { deletePost, savePost } from "../_actions/news";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(d) : "—");

export default async function NewsDashboard({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const editId = Number(sp.edit) || null;
  const creating = sp.new === "1";
  const editing = editId ? (await db.select().from(schema.posts).where(eq(schema.posts.id, editId)).limit(1))[0] : undefined;

  if (creating || editing) {
    const p = editing;
    return (
      <>
        <PageTitle title={p ? "Edit post" : "New post"}>
          <Link href="/dashboard/news" className={buttonVariants({ variant: "ghost", size: "sm" })}>← All posts</Link>
        </PageTitle>
        <Panel>
          <form action={savePost} className="space-y-5">
            {p && <input type="hidden" name="id" value={p.id} />}
            <div className="grid gap-5 md:grid-cols-[1fr_16rem]">
              <Field label="Title" htmlFor="title" required>
                <Input id="title" name="title" defaultValue={p?.title} required />
              </Field>
              <Field label="Category" htmlFor="category" required>
                <Select id="category" name="category" defaultValue={p?.category ?? ""} required>
                  <option value="" disabled>Choose</option>
                  {POST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Cover photo" htmlFor="cover" hint={p?.coverUrl ? "Choose a file to replace the current cover." : "JPG or PNG, up to 10 MB."}>
              <Input id="cover" name="cover" type="file" accept="image/jpeg,image/png" />
            </Field>
            <Field label="Story" htmlFor="body" hint="Leave a blank line between paragraphs.">
              <Textarea id="body" name="body" rows={14} defaultValue={p?.body} />
            </Field>
            <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-3 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
              <Button type="submit" name="intent" value="publish">Publish</Button>
              <Button type="submit" name="intent" value="draft" variant="outline">Save as draft</Button>
            </div>
          </form>
        </Panel>
      </>
    );
  }

  const posts = await db.select().from(schema.posts).orderBy(desc(schema.posts.updatedAt)).limit(100);
  return (
    <>
      <PageTitle title="News & blog" intro="Stories about sport, activities and announcements. Published posts appear on the website's News page.">
        <Link href="/dashboard/news?new=1" className={buttonVariants({ variant: "primary" })}><Plus aria-hidden /> New post</Link>
      </PageTitle>
      <Panel>
        {posts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead className="border-b border-slate-200 text-sm text-slate-600">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-semibold">Title</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Category</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                  <th scope="col" className="py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 font-semibold">{p.title}</td>
                    <td className="py-2 pr-4">{p.category}</td>
                    <td className="py-2 pr-4">{p.status === "published" ? <StatusPill tone="green">Published</StatusPill> : <StatusPill tone="amber">Draft</StatusPill>}</td>
                    <td className="py-2 pr-4">{fmt(p.publishedAt ?? p.updatedAt)}</td>
                    <td className="py-2">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/news?edit=${p.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                          <PenSquare aria-hidden /> Edit <span className="sr-only">{p.title}</span>
                        </Link>
                        <form action={deletePost}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button type="submit" variant="dangerGhost" size="sm"><Trash2 aria-hidden /> Delete <span className="sr-only">{p.title}</span></Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-600">No posts yet. Write the first one.</p>
        )}
      </Panel>
    </>
  );
}
