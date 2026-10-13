import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/content";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your school website" };

export default async function OnboardingPage() {
  const s = await getSettings();
  if (s?.onboardedAt) redirect("/");
  return (
    <main className="min-h-dvh bg-slate-50 py-10">
      <div className="container-page">
        <p className="eyebrow">Welcome</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Set up your school website</h1>
        <p className="mt-2 max-w-2xl text-slate-700">Three quick steps. You can change everything except the first administrator later in the dashboard.</p>
        <div className="mt-8">
          <OnboardingForm needsToken={Boolean(process.env.SETUP_TOKEN)} />
        </div>
      </div>
    </main>
  );
}
