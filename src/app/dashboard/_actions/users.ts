"use server";

import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { done } from "@/lib/flash";
import { str } from "@/lib/utils";

const back = "/dashboard/users";

export async function inviteUser(fd: FormData) {
  const u = await requireAdmin();
  const email = str(fd.get("email")).toLowerCase();
  const name = str(fd.get("name"));
  const role = str(fd.get("role")) === "admin" ? "admin" : "staff";
  if (!z.string().email().safeParse(email).success) done(back, "Enter a valid email address.", "error");
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) done(back, `${email} already has access.`, "error");
  await db.insert(schema.users).values({ email, name: name || null, role, status: "invited" });
  await logActivity(u.name, `invited ${email} as ${role === "admin" ? "an Admin" : "Staff"}`);
  done(back, `Invite sent to ${email}. They can sign in with their Microsoft school account.`);
}

async function otherAdmins(excludeId: number) {
  return db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "admin"), ne(schema.users.id, excludeId), ne(schema.users.status, "disabled")));
}

export async function changeRole(fd: FormData) {
  const u = await requireAdmin();
  const id = Number(fd.get("id"));
  const role = str(fd.get("role")) === "admin" ? "admin" : "staff";
  if (role === "staff" && !(await otherAdmins(id)).length) done(back, "There must always be at least one Admin.", "error");
  const [t] = await db.update(schema.users).set({ role }).where(eq(schema.users.id, id)).returning();
  if (!t) done(back, "User not found.", "error");
  await logActivity(u.name, `changed ${t.email} to ${role === "admin" ? "Admin" : "Staff"}`);
  done(back, `${t.email} is now ${role === "admin" ? "an Admin" : "Staff"}.`);
}

export async function removeUser(fd: FormData) {
  const u = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === u.id) done(back, "You can't remove your own access.", "error");
  const [t] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (!t) done(back, "User not found.", "error");
  if (t.role === "admin" && !(await otherAdmins(id)).length) done(back, "There must always be at least one Admin.", "error");
  await db.delete(schema.users).where(eq(schema.users.id, id));
  await logActivity(u.name, `removed access for ${t.email}`);
  done(back, `${t.email} no longer has access.`);
}
