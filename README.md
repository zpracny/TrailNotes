# TrailNotes - Dev Dashboard

Osobní dashboard pro programátory - sledování nápadů, správa deploymentů, předplatných a organizace odkazů.

## Funkce

- **Nápady** - Sledování programovacích nápadů s tagy, statusem a odkazy (grid + kanban)
- **Služby** - Monitoring deploymentů (AWS Lambda, n8n, Raspberry Pi, Docker, Vercel, EC2)
- **Odkazy** - Organizace odkazů do kategorií s tagy
- **Předplatné** - Přehled předplatných s měsíčními náklady v CZK
- **Hlasové poznámky** - Nahrávání a přepis audio poznámek
- **Admin panel** - Správa přístupu (whitelist nebo všichni)
- **Klávesové zkratky** - `n` nový nápad, `d` nová služba, `p` ping všech, `h` domů

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, TailwindCSS
- **Backend**: Neon PostgreSQL + Drizzle ORM
- **Auth**: Neon Auth (Better Auth) - Google OAuth + email/password
- **Deploy**: Vercel
- **Produkce**: https://trailnotes.pracny.app

---

## Rychlý start

### 1. Naklonuj a nainstaluj

```bash
git clone <repo>
cd TrailNotes
npm install
```

### 2. Vytvoř Neon projekt

1. Jdi na [console.neon.tech](https://console.neon.tech) a vytvoř nový projekt
2. Zapni **Neon Auth** v nastavení projektu (Auth tab)
3. Povol Google OAuth provider v Auth → Settings

### 3. Spusť SQL schéma

V **Neon Console → SQL Editor** spusť:

```
neon/schema.sql
```

### 4. Nastav environment variables

Vytvoř soubor `.env.local`:

```bash
# Neon Database
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx-pooler.xxx.neon.tech/neondb?sslmode=require

# Neon Auth
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.xxx.neon.tech/neondb/auth
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin email
ADMIN_EMAIL=tvuj-email@gmail.com
```

### 5. Spusť dev server

```bash
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000)

> **Poznámka**: Google OAuth se sdílenými klíči Neon Auth nefunguje na localhost. Pro testování auth je potřeba deploy na Vercel.

---

## Nasazení na Vercel

1. Push na GitHub
2. Import do Vercel
3. Přidej environment variables:
   - `DATABASE_URL`
   - `NEON_AUTH_BASE_URL`
   - `BETTER_AUTH_URL` = `https://trailnotes.pracny.app`
   - `NEXT_PUBLIC_APP_URL` = `https://trailnotes.pracny.app`
   - `ADMIN_EMAIL`

---

## Struktura projektu

```
├── app/
│   ├── (protected)/          # Chráněné stránky (vyžadují přihlášení)
│   │   ├── dashboard/        # Přehled
│   │   ├── ideas/            # Nápady (seznam, nový, detail)
│   │   ├── deployments/      # Služby (seznam, nová, detail)
│   │   ├── links/            # Odkazy s kategoriemi
│   │   ├── subscriptions/    # Předplatné
│   │   ├── voice-notes/      # Hlasové poznámky
│   │   └── admin/            # Admin panel
│   ├── api/auth/[...path]/   # Neon Auth API handler
│   ├── auth/[path]/          # Auth UI stránky (sign-in, sign-up)
│   ├── login/                # Přihlašovací stránka
│   └── access-denied/        # Stránka odepřeného přístupu
├── actions/                  # Server Actions
│   ├── auth.ts               # Autentizace (Neon Auth)
│   ├── ideas.ts              # CRUD nápady
│   ├── deployments.ts        # CRUD služby
│   ├── links.ts              # CRUD odkazy a kategorie
│   ├── subscriptions.ts      # CRUD předplatné
│   ├── audio.ts              # Hlasové poznámky
│   └── admin.ts              # Admin funkce
├── components/               # React komponenty
│   ├── Navigation.tsx        # Boční navigace
│   ├── IdeaCard.tsx          # Karta nápadu
│   ├── DeploymentRow.tsx     # Řádek služby
│   ├── SubscriptionCard.tsx  # Karta předplatného
│   ├── TagsEditor.tsx        # Editor tagů s autocomplete
│   ├── LinksEditor.tsx       # Editor odkazů
│   └── StatusBadge.tsx       # Badge statusu
├── lib/
│   ├── auth/                 # Neon Auth klient a server
│   │   ├── client.ts         # Client-side auth
│   │   └── server.ts         # Server-side auth
│   ├── db/                   # Drizzle ORM
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema definice
│   └── supabase/types.ts     # Type re-exports (kompatibilita)
├── neon/
│   ├── schema.sql            # Kompletní DB schéma
│   └── import-data.sql       # Migrace dat ze Supabase
└── middleware.ts              # Route protection (Neon Auth)
```

---

## Databázové tabulky

| Tabulka | Popis |
|---------|-------|
| `ideas` | Programovací nápady (title, description, tags, links, status) |
| `deployments` | Služby (name, project, platform, url_ip, status, tags, links) |
| `link_categories` | Kategorie odkazů (name, icon) |
| `links` | Uložené odkazy (title, url, description, tags, category_id) |
| `subscriptions` | Předplatné (name, amount, currency, frequency, category) |
| `audio_notes` | Hlasové poznámky (file_url, transcription, status) |
| `app_settings` | Nastavení aplikace (access_mode: all/whitelist) |
| `allowed_users` | Whitelist povolených emailů |

---

## Klávesové zkratky

| Klávesa | Akce |
|---------|------|
| `n` | Nový nápad |
| `d` | Nová služba |
| `p` | Ping všech běžících služeb |
| `h` | Přejít na dashboard |
| `i` | Přejít na nápady |

---

## Admin panel

Admin má přístup k `/admin` kde může:

- Přepínat režim přístupu:
  - **Všichni** - kdokoliv s Google účtem se může přihlásit
  - **Whitelist** - pouze emaile ze seznamu povolených
- Spravovat whitelist (přidávat/odebírat emaily)

Admin email se nastavuje v `ADMIN_EMAIL` environment variable.

---

## Barevné schéma

| Barva | Hex | Použití |
|-------|-----|---------|
| Background | `#1e293b` | Pozadí aplikace |
| Card | `#334155` | Pozadí karet |
| Accent | `#10b981` | Akcentová barva (zelená) |
| Text | `#f8fafc` | Hlavní text |
| Muted | `#94a3b8` | Sekundární text |

---

## Licence

MIT
