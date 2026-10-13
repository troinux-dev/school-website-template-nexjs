import type { Metadata, Viewport } from "next";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";
import { getSiteSettings } from "@/lib/content";
import { themeCss, DEFAULT_ACCENT, DEFAULT_PRIMARY } from "@/lib/colors";

export const dynamic = "force-dynamic";

async function safeSettings() {
  try {
    return await getSiteSettings();
  } catch (e) {
    console.error("Could not load settings", e);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await safeSettings();
  const name = s?.schoolName ?? "School";
  return { title: { default: name, template: `%s · ${name}` }, description: `${name} — official school website.` };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await safeSettings();
  const css = themeCss(s?.primaryColor ?? DEFAULT_PRIMARY, s?.accentColor ?? DEFAULT_ACCENT);
  return (
    <html lang="en">
      <head>
        <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
