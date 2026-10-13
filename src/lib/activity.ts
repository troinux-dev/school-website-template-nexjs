import "server-only";
import { db, schema } from "@/db";

export async function logActivity(actor: string, action: string) {
  try {
    await db.insert(schema.activity).values({ actor, action });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
