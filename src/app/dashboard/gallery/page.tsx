import Image from "next/image";
import { desc, eq } from "drizzle-orm";
import { Trash2, Upload } from "lucide-react";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { GALLERY_CATEGORIES } from "@/lib/event-types";
import { todayISO, fmtLong } from "@/lib/dates";
import { PageTitle, Panel } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { removePhoto, uploadPhotos } from "../_actions/gallery";

export default async function GalleryDashboard() {
  await requireUser();
  const recent = await db
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
    .orderBy(desc(schema.photos.createdAt), desc(schema.photos.id))
    .limit(48);

  return (
    <>
      <PageTitle title="Gallery" intro="New photos appear on the Gallery page and in “Latest from the Gallery” on the homepage straight away." />
      <div className="space-y-6">
        <Panel title="Upload photos" id="upload">
          <form action={uploadPhotos} className="grid gap-5 md:grid-cols-2">
            <Field label="Photos" htmlFor="photos" required hint="JPG or PNG, up to 10 MB each. You can choose several." className="md:col-span-2">
              <Input id="photos" name="photos" type="file" accept="image/jpeg,image/png" multiple required className="file:mr-4 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:font-semibold" />
            </Field>
            <Field label="Album" htmlFor="category" required>
              <Select id="category" name="category" defaultValue="" required>
                <option value="" disabled>Choose an album</option>
                {GALLERY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Event date" htmlFor="eventDate" required>
              <Input id="eventDate" name="eventDate" type="date" defaultValue={todayISO()} required />
            </Field>
            <Field label="Caption" htmlFor="caption" required hint="Shown as the title, e.g. “Inter-house athletics”.">
              <Input id="caption" name="caption" required />
            </Field>
            <Field label="Alt text" htmlFor="alt" hint="Describe the photos for screen-reader users. Defaults to the caption.">
              <Input id="alt" name="alt" />
            </Field>
            <div className="md:col-span-2">
              <Button type="submit"><Upload aria-hidden /> Upload photos</Button>
            </div>
          </form>
        </Panel>

        <Panel title="Recent uploads" id="recent">
          {recent.length ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recent.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image src={p.url} alt={p.alt} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-bold uppercase tracking-wider text-accent-ink">{p.category}</p>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-slate-600">{fmtLong(p.eventDate)}</p>
                    <form action={removePhoto}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="dangerGhost" size="sm" className="-ml-3">
                        <Trash2 aria-hidden /> Remove <span className="sr-only">{p.alt}</span>
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No photos yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
