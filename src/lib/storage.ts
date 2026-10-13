import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "public-assets";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PDF_TYPES = ["application/pdf"];

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export class UploadError extends Error {}

function ext(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) return fromName;
  return file.type === "application/pdf" ? ".pdf" : file.type === "image/png" ? ".png" : ".jpg";
}

export function hasFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "size" in v && (v as File).size > 0;
}

/**
 * Store an uploaded file and return its public URL.
 * Uses Supabase Storage when configured, otherwise the local ./uploads folder (mount it as a Docker volume).
 */
export async function saveUpload(
  file: File,
  folder: string,
  kind: "image" | "pdf" = "image",
): Promise<string> {
  const allowed = kind === "pdf" ? PDF_TYPES : IMAGE_TYPES;
  const max = kind === "pdf" ? MAX_PDF_BYTES : MAX_PHOTO_BYTES;
  if (!allowed.includes(file.type)) {
    throw new UploadError(kind === "pdf" ? "Only PDF files can be uploaded here." : "Photos must be JPG or PNG.");
  }
  if (file.size > max) throw new UploadError(`"${file.name}" is larger than ${Math.round(max / 1024 / 1024)} MB.`);

  const key = `${folder}/${new Date().toISOString().slice(0, 10)}-${randomUUID()}${ext(file)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey && !url.includes("<")) {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from(BUCKET).upload(key, bytes, { contentType: file.type, upsert: false });
    if (error) throw new UploadError(`Upload failed: ${error.message}`);
    return supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  }

  const dest = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  return `/uploads/${key}`;
}
