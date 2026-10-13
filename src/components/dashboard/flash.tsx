"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export function Flash() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = sp.get("ok");
  const error = sp.get("error");
  const [hidden, setHidden] = useState(false);
  useEffect(() => setHidden(false), [ok, error]);
  if ((!ok && !error) || hidden) return null;

  function dismiss() {
    setHidden(true);
    const next = new URLSearchParams(sp.toString());
    next.delete("ok");
    next.delete("error");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const isError = Boolean(error);
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${isError ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-900"}`}
    >
      {isError ? <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />}
      <p className="flex-1 font-semibold">{error ?? ok}</p>
      <button type="button" onClick={dismiss} className="-m-2 inline-flex size-12 items-center justify-center rounded-lg hover:bg-black/5" aria-label="Dismiss message">
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}
