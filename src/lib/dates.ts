/** Date helpers. All calendar dates are plain "YYYY-MM-DD" strings in the school's time zone. */

export const SCHOOL_TZ = process.env.SCHOOL_TIMEZONE ?? "Africa/Johannesburg";

export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SCHOOL_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function currentYear(): number {
  return Number(todayISO().slice(0, 4));
}

/** UTC midnight Date for a YYYY-MM-DD string (safe for arithmetic). */
export function d(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, n: number): string {
  const x = d(isoDate);
  x.setUTCDate(x.getUTCDate() + n);
  return iso(x);
}

export function diffDays(a: string, b: string): number {
  return Math.round((d(b).getTime() - d(a).getTime()) / 86_400_000);
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-ZA", { ...o, timeZone: "UTC" });

export const fmtShort = (s: string) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(d(s)).replace(",", "");
export const fmtLong = (s: string) => fmt({ day: "numeric", month: "long", year: "numeric" }).format(d(s));
export const fmtMonthShort = (s: string) => fmt({ month: "short" }).format(d(s));
export const fmtDay = (s: string) => String(d(s).getUTCDate());
export const fmtMonthYear = (y: number, m: number) => fmt({ month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1)));

/** Monday = 0 … Sunday = 6 */
export function weekdayMon(isoDate: string): number {
  return (d(isoDate).getUTCDay() + 6) % 7;
}

export function monthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function parseMonthKey(v: string | undefined): { y: number; m: number } {
  const t = todayISO();
  const match = v?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]);
    if (m >= 1 && m <= 12 && y > 1900 && y < 3000) return { y, m };
  }
  return { y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) };
}

export function shiftMonth(y: number, m: number, delta: number) {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}
