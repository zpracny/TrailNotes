# TrailNotes - Dev Dashboard

Osobní dashboard pro programátory - sledování nápadů, správa deploymentů a organizace odkazů.

## Funkce

- **Nápady** - Sledování programovacích nápadů s tagy, statusem a odkazy
- **Služby** - Monitoring deploymentů (AWS Lambda, n8n, Raspberry Pi, Docker, Vercel, EC2)
- **Odkazy** - Organizace odkazů do kategorií s tagy
- **Admin panel** - Správa přístupu (whitelist nebo všichni)
- **Realtime** - Živá synchronizace pomocí Supabase
- **Klávesové zkratky** - `n` nový nápad, `d` nová služba, `p` ping všech, `h` domů

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Auth**: Google OAuth
- **Deploy**: Vercel

---

## Rychlý start

### 1. Naklonuj a nainstaluj

```bash
git clone <repo>
cd trailnotes
npm install
```

### 2. Vytvoř Supabase projekt

1. Jdi na [supabase.com](https://supabase.com) a vytvoř nový projekt
2. Počkej až se projekt inicializuje

### 3. Nastav Google OAuth

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Zkopíruj **Client ID** a **Client Secret**

2. **Supabase Dashboard**:
   - Authentication → Providers → Google → Enable
   - Vlož Client ID a Client Secret
   - Authentication → URL Configuration:
     - Site URL: `http://localhost:3000`
     - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Spusť SQL schéma

V **Supabase Dashboard → SQL Editor** spusť celý obsah souboru:

```
supabase/schema.sql
```

### 5. Nastav environment variables

Vytvoř soubor `.env.local`:

```bash
# Supabase (najdeš v Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Admin email (tvůj Google účet)
ADMIN_EMAIL=tvuj-email@gmail.com
```

### 6. Spusť dev server

```bash
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000)

---

## Nasazení na Vercel

1. Push na GitHub
2. Import do Vercel
3. Přidej environment variables (stejné jako `.env.local`)
4. V Supabase přidej produkční URLs:
   - Site URL: `https://trailnotes.pracny.app`
   - Redirect URLs: `https://trailnotes.pracny.app/auth/callback`

---

## Struktura projektu

```
├── app/
│   ├── (protected)/          # Chráněné stránky (vyžadují přihlášení)
│   │   ├── dashboard/        # Přehled
│   │   ├── ideas/            # Nápady (seznam, nový, detail)
│   │   ├── deployments/      # Služby (seznam, nová, detail)
│   │   ├── links/            # Odkazy s kategoriemi
│   │   └── admin/            # Admin panel
│   ├── auth/callback/        # Google OAuth callback
│   ├── login/                # Přihlašovací stránka
│   └── access-denied/        # Stránka odepřeného přístupu
├── actions/                  # Server Actions
│   ├── auth.ts               # Autentizace
│   ├── ideas.ts              # CRUD nápady
│   ├── deployments.ts        # CRUD služby
│   ├── links.ts              # CRUD odkazy a kategorie
│   └── admin.ts              # Admin funkce
├── components/               # React komponenty
│   ├── Navigation.tsx        # Boční navigace
│   ├── IdeaCard.tsx          # Karta nápadu
│   ├── DeploymentRow.tsx     # Řádek služby
│   ├── TagsEditor.tsx        # Editor tagů s autocomplete
│   ├── LinksEditor.tsx       # Editor odkazů
│   └── StatusBadge.tsx       # Badge statusu
├── lib/supabase/             # Supabase klient
└── supabase/
    ├── schema.sql            # Kompletní DB schéma (nová instalace)
    └── migration-v2.sql      # Migrace pro upgrade
```

---

## Databázové tabulky

| Tabulka | Popis |
|---------|-------|
| `ideas` | Programovací nápady (title, description, tags, links, status) |
| `deployments` | Služby (name, project, platform, url_ip, status, tags, links) |
| `link_categories` | Kategorie odkazů (name, icon) |
| `links` | Uložené odkazy (title, url, description, tags, category_id) |
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

## Upgrade existující databáze

Pokud už máš databázi z předchozí verze, spusť:

```
supabase/migration-v2.sql
```

Přidá:
- `links` sloupec do ideas a deployments
- `tags` sloupec do deployments
- Tabulky `link_categories` a `links`

---

## Suggested Tags (autocomplete)

```
n8n, TrailMetrics, AWS, Raspberry, kolo, Alpy, chata
```

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
