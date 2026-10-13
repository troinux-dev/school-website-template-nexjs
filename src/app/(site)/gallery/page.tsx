import type { Metadata } from "next";
import { galleryPage } from "@/lib/gallery";
import { GALLERY_CATEGORIES } from "@/lib/event-types";
import { GalleryGrid } from "./gallery-grid";

export const metadata: Metadata = { title: "Gallery" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function GalleryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = typeof sp.category === "string" ? sp.category : "";
  const category = (GALLERY_CATEGORIES as readonly string[]).includes(raw) ? raw : "";
  const { items, total } = await galleryPage(category || undefined, 0);
  return (
    <>
      <section className="bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Gallery</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Life at our school</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">Sport, culture, academics and events — moments from across the year.</p>
        </div>
      </section>
      <section className="section">
        <div className="container-page">
          <GalleryGrid key={category} initial={items} total={total} category={category} />
        </div>
      </section>
    </>
  );
}
