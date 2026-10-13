import { redirect } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getPage, getSiteSettings } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSiteSettings();
  if (!s.onboarded) redirect("/onboarding");
  const home = await getPage("home");
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:shadow-lg">
        Skip to main content
      </a>
      <Header name={s.schoolName} logoUrl={s.logoUrl} admissionsOpen={s.admissionPeriod} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer name={s.schoolName} footer={home.footer} />
    </>
  );
}
