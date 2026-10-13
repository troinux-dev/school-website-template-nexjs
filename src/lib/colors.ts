/** Brand colour helpers. Keep every colour pairing at WCAG AA (4.5:1) automatically. */

export const DEFAULT_PRIMARY = "#0B1F3A"; // navy
export const DEFAULT_ACCENT = "#D4A62A"; // gold

const HEX = /^#([0-9a-f]{6})$/i;

export function isHex(v: string): boolean {
  return HEX.test(v);
}

export function normalizeHex(v: string, fallback: string): string {
  const s = v.trim();
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return ("#" + s.slice(1).split("").map((c) => c + c).join("")).toUpperCase();
  }
  return isHex(s) ? s.toUpperCase() : fallback;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const DARK_TEXT = "#111827";
const WHITE = "#FFFFFF";

/** Text colour (white or near-black) to place on top of a filled background. */
export function readableOn(bg: string): string {
  return contrast(bg, WHITE) >= contrast(bg, DARK_TEXT) ? WHITE : DARK_TEXT;
}

function mix(hex: string, target: [number, number, number], t: number): string {
  const c = rgb(hex);
  return toHex([0, 1, 2].map((i) => c[i] + (target[i] - c[i]) * t) as [number, number, number]);
}

/** Darken a colour just enough to reach `ratio` against white (for text / thin lines on light surfaces). */
export function inkOnWhite(hex: string, ratio = 4.5): string {
  for (let t = 0; t <= 1; t += 0.02) {
    const c = mix(hex, [0, 0, 0], t);
    if (contrast(c, WHITE) >= ratio) return c;
  }
  return "#000000";
}

/** Lighten a colour just enough to reach `ratio` against a dark background. */
export function inkOn(bg: string, hex: string, ratio = 4.5): string {
  const toward: [number, number, number] = luminance(bg) < 0.5 ? [255, 255, 255] : [0, 0, 0];
  for (let t = 0; t <= 1; t += 0.02) {
    const c = mix(hex, toward, t);
    if (contrast(c, bg) >= ratio) return c;
  }
  return readableOn(bg);
}

export type Theme = Record<string, string>;

/** CSS custom properties consumed by Tailwind's @theme (see globals.css). */
export function themeVars(primary: string, accent: string): Theme {
  const p = normalizeHex(primary, DEFAULT_PRIMARY);
  const a = normalizeHex(accent, DEFAULT_ACCENT);
  return {
    "--brand-primary": p,
    "--brand-primary-fg": readableOn(p),
    "--brand-primary-ink": inkOnWhite(p),
    "--brand-primary-soft": mix(p, [255, 255, 255], 0.92),
    "--brand-accent": a,
    "--brand-accent-fg": readableOn(a),
    "--brand-accent-ink": inkOnWhite(a),
    "--brand-accent-soft": mix(a, [255, 255, 255], 0.85),
    "--brand-accent-on-primary": inkOn(p, a),
  };
}

export function themeCss(primary: string, accent: string): string {
  const vars = themeVars(primary, accent);
  return `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`;
}
