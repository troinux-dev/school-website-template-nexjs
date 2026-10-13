import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Photo } from "@/components/site/bits";

export const metadata: Metadata = { title: "News" };

const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric" }).format(d) : "");

export default async function NewsPage() {
  const posts = await db.select().from(schema.posts).where(eq(schema.posts.status, "published")).orderBy(desc(schema.posts.publishedAt)).limit(30);
  return (
    <>
      <section className="bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">News</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">News & stories</h1>
        </div>
      </section>
      <section className="section">
        <div className="container-page">
          {posts.length ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/news/${p.id}`} className="card group block overflow-hidden">
                    <Photo src={p.coverUrl ?? ""} alt="" sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[16/10]" rounded="rounded-none" />
                    <div className="space-y-1 p-5">
                      <p className="text-sm font-bold uppercase tracking-wider text-accent-ink">{p.category}</p>
                      <h2 className="text-lg font-semibold group-hover:underline">{p.title}</h2>
                      <p className="text-sm text-slate-600">{fmt(p.publishedAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No news yet — check back soon.</p>
          )}
        </div>
      </section>
    </>
  );
}
