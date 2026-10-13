import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Photo } from "@/components/site/bits";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const [p] = await db.select().from(schema.posts).where(and(eq(schema.posts.id, n), eq(schema.posts.status, "published"))).limit(1);
  return p ?? null;
}

export async function generateMetadata({ params }: Props) {
  const p = await load((await params).id);
  return { title: p?.title ?? "News" };
}

export default async function PostPage({ params }: Props) {
  const p = await load((await params).id);
  if (!p) notFound();
  return (
    <article className="section">
      <div className="container-page max-w-3xl">
        <Link href="/news" className="inline-flex min-h-12 items-center font-semibold text-primary-ink underline underline-offset-4">← All news</Link>
        <p className="eyebrow mt-4">{p.category}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
        {p.publishedAt && (
          <p className="mt-2 text-slate-600">{new Intl.DateTimeFormat("en-ZA", { dateStyle: "long" }).format(p.publishedAt)}</p>
        )}
        {p.coverUrl && <Photo src={p.coverUrl} alt="" sizes="(max-width: 768px) 100vw, 768px" className="mt-6 aspect-[16/9]" priority />}
        <div className="prose-plain mt-8 text-lg text-slate-800">
          {p.body.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
