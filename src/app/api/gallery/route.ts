import { NextResponse } from "next/server";
import { galleryPage } from "@/lib/gallery";
import { GALLERY_CATEGORIES } from "@/lib/event-types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get("category") ?? "";
  const category = (GALLERY_CATEGORIES as readonly string[]).includes(cat) ? cat : undefined;
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const data = await galleryPage(category, offset);
  return NextResponse.json(data);
}
