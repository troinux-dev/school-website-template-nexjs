import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db";

export type Role = "admin" | "staff";
export type CurrentUser = { id: number; email: string; name: string; role: Role };

const SHORT_SESSION_MS = 12 * 60 * 60 * 1000; // when "Keep me signed in" is not ticked

/** The signed-in user, re-read from the database on every request so role changes apply at once. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!session || !email) return null;
  if (!session.remember && Date.now() - (session.signedInAt ?? 0) > SHORT_SESSION_MS) return null;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u || u.status === "disabled") return null;
  return { id: u.id, email: u.email, name: u.name ?? u.email, role: u.role === "admin" ? "admin" : "staff" };
});

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/portal");
  return u;
}

/** Server-side guard for Admin-only pages and actions (DB-01.4). */
export async function requireAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/dashboard?error=" + encodeURIComponent("That section is for admins only."));
  return u;
}
