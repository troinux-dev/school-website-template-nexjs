import "server-only";
import { getCurrentUser } from "./session";

/** Draft preview (DB-04 "Preview this page") is only available to signed-in admins. */
export async function isPreview(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const sp = await searchParams;
  if (sp.preview !== "1") return false;
  const u = await getCurrentUser().catch(() => null);
  return u?.role === "admin";
}
