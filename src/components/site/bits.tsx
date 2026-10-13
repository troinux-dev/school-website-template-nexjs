import Image from "next/image";
import Link from "next/link";
import { Award, ImageIcon, Lock, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/content";
import { EVENT_STYLE } from "@/lib/event-types";
import { fmtDay, fmtMonthShort } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";

/** next/image with responsive sizes, or a neutral placeholder when no image has been uploaded. */
export function Photo({
  src,
  alt,
  sizes,
  className,
  priority,
  rounded = "rounded-2xl",
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  rounded?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-primary-soft", rounded, className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-primary-ink/50" role="img" aria-label={alt || "Image coming soon"}>
          <ImageIcon className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}

export function Headshot({ src, name }: { src: string; name: string }) {
  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-primary-soft">
      {src ? (
        <Image src={src} alt={`Photo of ${name}`} fill sizes="96px" className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-primary-ink/60" role="img" aria-label={`No photo for ${name || "this leader"}`}>
          <UserRound className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}

/** HM-06 / AB-05: exactly three badges; standard icon when no logo is uploaded. */
export function Badges({ badges, className }: { badges: Badge[]; className?: string }) {
  const shown = badges.filter((b) => b.name);
  if (!shown.length) return null;
  return (
    <ul className={cn("grid grid-cols-1 gap-4 sm:grid-cols-3", className)}>
      {shown.slice(0, 3).map((b, i) => (
        <li key={i} className="card flex flex-col items-center gap-3 p-5 text-center">
          {b.logoUrl ? (
            <div className="relative size-16">
              <Image src={b.logoUrl} alt={`${b.name} logo`} fill sizes="64px" className="object-contain" />
            </div>
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-accent-ink" aria-hidden>
              <Award className="size-8" />
            </span>
          )}
          <div>
            <p className="font-semibold text-slate-900">{b.name}</p>
            {b.year && <p className="text-sm text-slate-600">{b.year}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TypePill({ type }: { type: string }) {
  const s = EVENT_STYLE[type] ?? EVENT_STYLE.Meetings;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold" style={{ background: s.soft, color: s.text }}>
      {type}
    </span>
  );
}

export function DateBlock({ date, type }: { date: string; type: string }) {
  const s = EVENT_STYLE[type] ?? EVENT_STYLE.Meetings;
  return (
    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl py-1.5 text-white" style={{ background: s.bg }} aria-hidden>
      <span className="text-xs font-bold uppercase">{fmtMonthShort(date)}</span>
      <span className="font-heading text-xl font-semibold leading-none">{fmtDay(date)}</span>
    </div>
  );
}

export function PrivateTag({ audience }: { audience: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-700">
      <Lock className="size-3.5" aria-hidden /> Private{audience ? ` · ${audience}` : ""}
    </span>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-section mt-1">{title}</h2>
      </div>
      {action && (
        <Link href={action.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export function PreviewBanner() {
  return (
    <div className="bg-amber-100 px-4 py-3 text-center font-semibold text-amber-900" role="status">
      Preview — you are viewing unpublished draft content.
    </div>
  );
}
