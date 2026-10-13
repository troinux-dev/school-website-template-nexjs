"use server";

import { z } from "zod";
import { db, schema } from "@/db";
import { str } from "@/lib/utils";

export type FormState = { ok: boolean; errors: Record<string, string>; values: Record<string, string> };

const input = z.object({
  name: z.string().min(1, "Enter your full name.").max(120),
  email: z.string().min(1, "Enter your email address.").email("Enter a valid email address, like name@example.com."),
  phone: z.string().max(40).optional(),
  department: z.string().max(60).optional(),
  message: z.string().min(1, "Enter your message.").max(5000),
});

export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = {
    name: str(fd.get("name")),
    email: str(fd.get("email")),
    phone: str(fd.get("phone")),
    department: str(fd.get("department")),
    message: str(fd.get("message")),
  };
  if (str(fd.get("website"))) return { ok: true, errors: {}, values: {} }; // honeypot
  const parsed = input.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, errors, values };
  }
  await db.insert(schema.contactMessages).values({
    ...parsed.data,
    phone: parsed.data.phone || null,
    department: parsed.data.department || null,
  });
  return { ok: true, errors: {}, values: {} };
}
