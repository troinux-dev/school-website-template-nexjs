"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut, DEV_LOGIN_ENABLED, KEEP_SIGNED_IN_COOKIE } from "@/auth";
import { str } from "@/lib/utils";

async function rememberChoice(fd: FormData) {
  const jar = await cookies();
  jar.set(KEEP_SIGNED_IN_COOKIE, fd.get("remember") === "on" ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
}

export async function signInAction(fd: FormData) {
  const email = str(fd.get("email")).toLowerCase();
  const intent = str(fd.get("intent"));
  await rememberChoice(fd);
  try {
    if (intent === "dev" && DEV_LOGIN_ENABLED) {
      await signIn("dev", { email, password: str(fd.get("password")), redirectTo: "/dashboard" });
    } else {
      await signIn("microsoft-entra-id", { redirectTo: "/dashboard" }, email ? { login_hint: email } : undefined);
    }
  } catch (e) {
    if (e instanceof AuthError) {
      const q = new URLSearchParams({ error: e.type === "CredentialsSignin" ? "CredentialsSignin" : "Default" });
      if (email) q.set("email", email);
      redirect(`/portal?${q}`);
    }
    throw e; // NEXT_REDIRECT on success
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
