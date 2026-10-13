"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { PolicyDoc } from "@/lib/content";

/** AB-04 / DB-04.4.5 — documents with a display name and a PDF, plus "Add another document". */
export function DocRows({ docs }: { docs: PolicyDoc[] }) {
  const [rows, setRows] = useState<PolicyDoc[]>(docs.length ? docs : [{ name: "", url: "" }]);
  return (
    <div className="space-y-4">
      <input type="hidden" name="doc.count" value={rows.length} />
      {rows.map((d, i) => (
        <fieldset key={i} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <legend className="px-1 text-sm font-semibold text-slate-600">Document {i + 1}</legend>
          <input type="hidden" name={`doc${i}.url`} value={d.url} />
          <div className="space-y-1.5">
            <label htmlFor={`doc${i}-name`} className="block font-semibold">Display name <span className="text-red-700">*</span></label>
            <Input id={`doc${i}-name`} name={`doc${i}.name`} defaultValue={d.name} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`doc${i}-file`} className="block font-semibold">
              PDF {d.url ? <span className="font-normal text-slate-600">(choose to replace)</span> : <span className="text-red-700">*</span>}
            </label>
            {d.url && (
              <a href={d.url} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm font-semibold text-primary-ink underline">
                <FileText className="size-4" aria-hidden /> Current file
              </a>
            )}
            <Input id={`doc${i}-file`} name={`doc${i}.file`} type="file" accept="application/pdf" />
          </div>
          <label className="inline-flex min-h-12 items-center gap-2 font-semibold text-red-700">
            <input type="checkbox" name={`doc${i}.remove`} className="size-5" /> Remove
          </label>
        </fieldset>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { name: "", url: "" }])}>
        <Plus aria-hidden /> Add another document
      </Button>
    </div>
  );
}
