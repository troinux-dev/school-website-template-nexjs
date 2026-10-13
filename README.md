# School Website v2 — MVP

Mobile-first school website with a role-based admin dashboard, built to the **School Website v2 Features & ACs** spec.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 with shadcn-style components · Supabase PostgreSQL via Drizzle ORM · Auth.js v5 with Microsoft Entra ID (MFA via Security Defaults) · Docker multi-stage build deployed from Git.

## What's included

| Area | Spec IDs | Notes |
|---|---|---|
| Onboarding (first run) | — | School name, primary + highlight colour (with live preview and contrast checks), first admin. Protected by `SETUP_TOKEN`. |
| Header, mobile menu, footer | GL-01 – GL-05 | Fixed header, gold underline + `aria-current`, ≤1024px menu with `aria-expanded`/`aria-controls`, auto copyright year. |
| Admission switch | GL-04, DB-02, DB-07 | One setting drives header, menu, Home hero, About banner and Apply page. |
| Home | HM-01 – HM-06 | Stats with auto "years serving", gallery cards from 3 most-recent albums, next 3 public events, testimonial + 3 badges. |
| About | AB-01 – AB-06 | Story, MVV, leadership with headshot placeholders, PDF documents, awards shared with Home. |
| Gallery | GA-01 – GA-03 | Category filter (`aria-pressed`), count line, Load more. |
| Calendar | CA-01 – CA-08 | Mon–Sun grid, continuous multi-day bars, colour key, Next up, 8 upcoming, private events for signed-in users, term dates, `.ics` + webcal subscribe. |
| Contact Us | CO-01 – CO-03 | Tap-to-call/mailto cards, validated form with confirmation, map embed, department contacts. |
| Apply Now | AP-01 – AP-03 | Admin-configured fields (max 7), "What happens next", closed state. |
| Portal | PO-01, PO-02 | Microsoft sign-in, keep-me-signed-in, SSPR link, invite-only. |
| Dashboard | DB-01 – DB-09 | Admin/Staff roles enforced server-side, overview + activity, page editor with drafts/publish/preview, branding, news, gallery, events, admissions, users. |
| Non-functional | NF-01 – NF-04 | 48px targets, 16px inputs, 320px+ with no sideways scroll, WCAG AA colours (auto-darkened text shades), responsive images, Poppins/Lato. |

Also added: a public **News** page (linked from the footer) so published blog posts have somewhere to appear.

## Decisions worth knowing

- **Sign-in is Microsoft, not a password form.** PO-01 shows email + password, but Entra ID with MFA can't take a password on our page. The Portal keeps the email field (it's passed as a login hint) and sends people to Microsoft, which handles password + Authenticator. "Forgot password?" goes to Microsoft's self-service reset.
- **Only invited people can sign in.** The first admin is created at onboarding; everyone else is invited in *Users & roles*. Invites are recorded, not emailed — tell the person to sign in at `/portal` with their school account.
- **Parents/learners** don't have accounts yet (spec §11.2). "Signed-in users" today means Staff and Admin, who see all private events.
- **Badges / leaders / documents** are required on **Publish**, not on Save as draft, so admins can save half-finished work. If Publish fails validation, the work is kept as a draft.
- **Uploads** go to Supabase Storage when configured, otherwise to `/app/uploads` (a Docker volume).

## Run in GitHub Codespaces

1. On the repo page click **Code → Codespaces → Create codespace on main**.
2. Wait for setup (installs packages, starts Postgres, runs migrations — a few minutes the first time). The dev server starts by itself and the site opens in a new tab.
3. You land on **/onboarding**: pick the school name and colours, and enter any admin email.
4. Sign in at **/portal** with that email, password `codespace`, using **Sign in (development)**.

If the tab doesn't open, use the **Ports** panel → port 3000 → open in browser. The first page load takes 20–30 seconds while Next.js compiles. To restart the server: `bash .devcontainer/start.sh` (log: `tail -f /tmp/next-dev.log`).

## Run with Docker (demo)

Builds the production image and a Postgres database, with the development sign-in turned on:

```bash
docker compose -f docker-compose.demo.yml up --build
```

In Codespaces, first stop the dev server (`pkill -f "next dev"`) since both use port 3000. Open http://localhost:3000 (in Codespaces, the forwarded port 3000), complete onboarding, then sign in at /portal with your admin email and password `demo`. Stop with Ctrl+C; add `-d` to run in the background and `docker compose -f docker-compose.demo.yml down -v` to wipe the data.

## Run locally

```bash
cp .env.example .env.local      # fill in DATABASE_URL and AUTH_SECRET at minimum
npm install
npm run db:migrate
# For local testing without Entra, add AUTH_DEV_LOGIN=true and AUTH_DEV_PASSWORD=... to .env.local
npm run dev
```

Open http://localhost:3000 → you're sent to `/onboarding`.

## Set up Microsoft Entra ID

1. Entra admin centre → **App registrations → New registration**. Single tenant.
2. Redirect URI (Web): `https://<your-domain>/api/auth/callback/microsoft-entra-id` (and `http://localhost:3000/...` for dev).
3. **Certificates & secrets → New client secret.** Copy the value to `AUTH_MICROSOFT_ENTRA_ID_SECRET`.
4. Copy the Application (client) ID and Directory (tenant) ID into `.env`.
5. **Properties → Security defaults: Enabled** — this enforces MFA with Microsoft Authenticator for every account.

## Deploy with Docker

```bash
docker compose up -d --build    # reads .env; runs DB migrations on start
```

The GitHub Actions workflow (`.github/workflows/docker.yml`) typechecks, builds, pushes `ghcr.io/<owner>/<repo>` on every push to `main`, and can redeploy your VPS over SSH (set `DEPLOY_ENABLED=true` plus `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`). Put a reverse proxy (Caddy/Traefik/Hostinger's) in front for HTTPS.

## Project layout

```
src/app/(site)/        public pages
src/app/portal/        sign-in
src/app/onboarding/    first-run setup
src/app/dashboard/     admin dashboard (+ _actions/ server actions)
src/db/schema.ts       Drizzle schema → drizzle/ SQL migrations
src/lib/               content, colours/theming, events, gallery, auth guards, storage
```
