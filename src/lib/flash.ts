import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/** Redirect back with a dismissible confirmation (DB-03). */
export function done(path: string, message: string, kind: "ok" | "error" = "ok"): never {
  revalidatePath("/", "layout");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}
