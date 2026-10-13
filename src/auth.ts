import NextAuth, { type NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const DEV_LOGIN_ENABLED = process.env.AUTH_DEV_LOGIN === "true";
export const KEEP_SIGNED_IN_COOKIE = "keep_signed_in";

const providers: NextAuthConfig["providers"] = [
  MicrosoftEntraID({
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    // https://login.microsoftonline.com/<tenant-id>/v2.0 — single tenant, so only school accounts work.
    issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    // Skip the Graph profile photo: it bloats the session cookie and we don't use it.
    profile(p) {
      return {
        id: p.sub,
        name: p.name,
        email: (p.email ?? p.preferred_username ?? "").toLowerCase(),
        image: null,
      };
    },
  }),
];

if (DEV_LOGIN_ENABLED) {
  // Local-development only: lets you test roles without an Entra tenant. Never enable in production.
  providers.push(
    Credentials({
      id: "dev",
      name: "Development sign-in",
      credentials: { email: {}, password: {} },
      async authorize(c) {
        const email = String(c?.email ?? "").toLowerCase().trim();
        const password = String(c?.password ?? "");
        if (!email || !process.env.AUTH_DEV_PASSWORD || password !== process.env.AUTH_DEV_PASSWORD) return null;
        const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (!u || u.status === "disabled") return null;
        return { id: String(u.id), email: u.email, name: u.name ?? u.email };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/portal", error: "/portal" },
  callbacks: {
    /** Only people an admin has invited (Users & roles) may sign in. */
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      if (!u || u.status === "disabled") return "/portal?error=NotInvited";
      await db
        .update(schema.users)
        .set({ status: "active", lastSignInAt: new Date(), name: u.name ?? user.name ?? null })
        .where(eq(schema.users.id, u.id));
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email?.toLowerCase();
        token.signedInAt = Date.now();
        try {
          const jar = await cookies();
          token.remember = jar.get(KEEP_SIGNED_IN_COOKIE)?.value === "1";
        } catch {
          token.remember = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.signedInAt = (token.signedInAt as number) ?? 0;
      session.remember = Boolean(token.remember);
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    signedInAt: number;
    remember: boolean;
  }
}
