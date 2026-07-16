# HimBean — Quickstart (Windows / VS Code)

This is tailored to the exact setup you already have working: Docker Desktop running a
local `himbean-db` Postgres container. Follow these in order.

## 0. Open the project
Unzip this file, then in VS Code: File → Open Folder → select the unzipped `himbean` folder.
Open a terminal inside VS Code (`` Ctrl+` ``) — everything below runs there.

## 1. Install dependencies
```powershell
npm install
```

## 2. Make sure your database container is running
```powershell
docker ps
```
You should see `himbean-db` with status `Up`. If it's not listed:
```powershell
docker start himbean-db
```
If you've never created it at all:
```powershell
docker run --name himbean-db -e POSTGRES_PASSWORD=localdev -p 5432:5432 -d postgres
```

## 3. Create `.env`
**Do not use Notepad** — it saves UTF-16 by default, which silently breaks Prisma's `.env`
parsing (this is exactly what happened last time). Run this in PowerShell instead:

```powershell
@"
DATABASE_URL="postgresql://postgres:localdev@localhost:5432/postgres"
AUTH_SECRET="a2f9c1e7b4d8a0f3c6e9b2d5a8f1c4e7b0d3a6f9c2e5b8d1a4f7c0e3b6d9a2f5"
"@ | Out-File -FilePath .env -Encoding utf8 -NoNewline
```

Verify it landed correctly:
```powershell
Get-Content .env
```
You should see both lines printed back cleanly.

## 4. Create tables + load the menu
```powershell
npx prisma migrate deploy
npm run db:seed
```
The seed script loads 127 menu items, the admin account, and everything else — it now
correctly reads `.env` on its own (this was fixed; earlier builds of this file didn't).

## 5. Run it
```powershell
npm run dev
```
Open **http://localhost:3000** — you should see the full menu, not the "bar is warming up"
placeholder.

## 6. (Optional) Log into the admin/POS views
- Admin: `http://localhost:3000/admin`
- POS: `http://localhost:3000/pos`
- Seed admin login: `admin@himbean.coffee` / whatever you set as `SEED_ADMIN_PASSWORD` in
  `.env` (add that line if you want a non-default password; otherwise check `prisma/seed.ts`
  for the fallback).

## If something errors
Paste the exact terminal output back — this project has already been through several rounds
of real bug fixes (env-loading, category-photo mismatches, a CSS seam bug, a missing `/about`
route) each verified with a real build and a real screenshot before being called done. Copy
the error verbatim rather than a summary — the exact wording is what identifies the cause.

## What's actually in this build
- Full commerce loop: cart → checkout → order → POS → admin, with server-authoritative
  pricing and atomic inventory
- 127-item menu across 14 categories, layered Featured/Popular/Explore navigation
- Real photography throughout (hero, flagship café, farmer stories, retail products)
- Six content pages: About, Careers, Wholesale, FAQ, Privacy, Terms
- Loyalty program (Altitude Perks), gift cards, guest checkout
- Stripe/email/SMS integration points wired and gated behind their respective API keys
  (inactive until you add real keys — see `docs/RUNBOOK.md`)
- Full docs in `docs/`: RUNBOOK, PR1/OR1 launch checklists, RELEASE_GATE, DECISIONS (ADRs)

typecheck 0 errors · production build passing · 33/33 tests passing, verified fresh
immediately before this package was created.
