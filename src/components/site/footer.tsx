import Link from "next/link";
import { Phone, MapPin } from "lucide-react";
import type { HomeContent } from "@/lib/content";
import { currentYear } from "@/lib/dates";

function Social({ href, label, path }: { href: string; label: string; path: string }) {
  if (!href) return null;
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-primary-fg hover:bg-white/20"
        aria-label={`${label} (opens in a new tab)`}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d={path} />
        </svg>
      </a>
    </li>
  );
}

const ICONS = {
  facebook: "M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1Z",
  instagram:
    "M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.9 8c-.1-1.6-.4-3-1.6-4.2S17.6 2.2 16 2.1c-1.7-.1-6.4-.1-8 0-1.6.1-3 .4-4.2 1.6S2.2 6.4 2.1 8c-.1 1.7-.1 6.4 0 8 .1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.7.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.3 0-8Zm-2.1 9.8a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.7.4s-4.4.1-5.7-.4a3.3 3.3 0 0 1-1.8-1.8c-.5-1.3-.4-4.3-.4-5.7s-.1-4.4.4-5.7A3.3 3.3 0 0 1 6.6 4.6c1.3-.5 4.3-.4 5.7-.4s4.4-.1 5.7.4a3.3 3.3 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.7Z",
  youtube:
    "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-4.8.5-4.8s0-3.2-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z",
};

export function Footer({ name, footer }: { name: string; footer: HomeContent["footer"] }) {
  const tel = footer.phone.replace(/[^\d+]/g, "");
  const hasSocial = footer.facebook || footer.instagram || footer.youtube;
  return (
    <footer className="bg-primary text-primary-fg">
      <div className="container-page flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <p className="font-heading text-lg font-semibold">{name}</p>
          {(footer.address || footer.city) && (
            <p className="flex items-start gap-2 opacity-90">
              <MapPin className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>
                {footer.address}
                {footer.address && footer.city ? ", " : ""}
                {footer.city}
              </span>
            </p>
          )}
          {footer.phone && (
            <a href={`tel:${tel}`} className="inline-flex min-h-12 items-center gap-2 font-semibold underline-offset-4 hover:underline">
              <Phone className="size-5" aria-hidden /> {footer.phone}
            </a>
          )}
          <p className="text-sm opacity-90">
            © {currentYear()} {name}. All rights reserved.
          </p>
          <p className="text-sm">
            <Link href="/news" className="inline-flex min-h-12 items-center underline underline-offset-4">
              News & stories
            </Link>
          </p>
        </div>
        {hasSocial && (
          <div>
            <p className="mb-2 font-semibold">Follow us</p>
            <ul className="flex gap-3">
              <Social href={footer.facebook} label="Facebook" path={ICONS.facebook} />
              <Social href={footer.instagram} label="Instagram" path={ICONS.instagram} />
              <Social href={footer.youtube} label="YouTube" path={ICONS.youtube} />
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}
