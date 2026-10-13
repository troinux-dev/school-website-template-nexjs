"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GalleryPhoto } from "@/lib/gallery";

const FILTERS = ["All", "Sports", "Cultural", "Academics", "Events"];

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));
}

export function GalleryGrid({ initial, total: initialTotal, category: initialCategory }: { initial: GalleryPhoto[]; total: number; category: string }) {
  const [category, setCategory] = useState(initialCategory || "All");
  const [items, setItems] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [pending, start] = useTransition();

  async function load(cat: string, offset: number) {
    const q = new URLSearchParams({ offset: String(offset) });
    if (cat !== "All") q.set("category", cat);
    const res = await fetch(`/api/gallery?${q}`);
    return (await res.json()) as { items: GalleryPhoto[]; total: number };
  }

  function choose(cat: string) {
    setCategory(cat);
    const url = new URL(window.location.href);
    if (cat === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", cat);
    window.history.replaceState(null, "", url);
    start(async () => {
      const data = await load(cat, 0);
      setItems(data.items);
      setTotal(data.total);
    });
  }

  function more() {
    start(async () => {
      const data = await load(category, items.length);
      setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    });
  }

  return (
    <div>
      <div role="group" aria-label="Filter photos by category" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={category === f}
            onClick={() => choose(f)}
            className={cn(
              "min-h-12 rounded-full border-2 px-5 font-semibold transition-colors",
              category === f ? "border-primary bg-primary text-primary-fg" : "border-slate-300 bg-white text-slate-800 hover:border-primary-ink",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="mt-4 text-slate-700" aria-live="polite">
        Showing {items.length} of {total} photo{total === 1 ? "" : "s"} · {category === "All" ? "All categories" : category}
      </p>

      {items.length ? (
        <ul className={cn("mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-60")}>
          {items.map((p) => (
            <li key={p.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-primary-soft">
                <Image src={p.url} alt={p.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
              </div>
              <div className="space-y-0.5 p-4">
                <p className="text-sm font-bold uppercase tracking-wider text-accent-ink">{p.category}</p>
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="text-sm text-slate-600">{fmt(p.eventDate)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-slate-600">No photos in this category yet.</p>
      )}

      {items.length < total && (
        <div className="mt-8 flex justify-center">
          <Button type="button" variant="outline" onClick={more} disabled={pending}>
            {pending ? "Loading…" : "Load more photos"}
          </Button>
        </div>
      )}
    </div>
  );
}
