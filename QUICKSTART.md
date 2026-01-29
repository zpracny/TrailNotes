# TrailNotes - Rychlý návod

---

## Git + GitHub + Vercel

### 1. Inicializace Git
```bash
cd C:\Claude\TrailNotes
git init
git add .
git commit -m "Initial commit"
```

### 2. Vytvoř GitHub repo
```
1. github.com → New repository
2. Název: TrailNotes
3. NEVYTVÁŘEJ README (už máme)
4. Zkopíruj URL repozitáře
```

### 3. Propoj a pushni
```bash
git remote add origin https://github.com/TVUJ_USERNAME/TrailNotes.git
git branch -M main
git push -u origin main
```

### 4. Deploy na Vercel
```
1. vercel.com → Add New Project
2. Import Git Repository → vyber TrailNotes
3. Environment Variables → přidej:
   - DATABASE_URL
   - NEON_AUTH_BASE_URL
   - BETTER_AUTH_URL (= produkční URL)
   - NEXT_PUBLIC_APP_URL (= produkční URL)
   - ADMIN_EMAIL
4. Deploy
```

### 5. Nastav doménu (volitelné)
```
1. Vercel → Project Settings → Domains
2. Přidej: trailnotes.pracny.app
3. Nastav DNS u registrátora
```

---

## Pro novou instalaci

### 1. Neon
```
1. Vytvoř projekt na console.neon.tech
2. Zapni Neon Auth (Auth tab)
3. Povol Google OAuth v Auth → Settings
4. SQL Editor → spusť neon/schema.sql
5. Zkopíruj DATABASE_URL a NEON_AUTH_BASE_URL
```

### 2. Lokální vývoj
```bash
npm install
# Vytvoř .env.local s klíči z Neon konzole
npm run dev
```

> Google OAuth nefunguje na localhost se sdílenými klíči Neon Auth.
> Pro testování auth deployni na Vercel.

### 3. Vercel deploy
```
1. Push na GitHub
2. Import do Vercel
3. Přidej env variables
4. BETTER_AUTH_URL a NEXT_PUBLIC_APP_URL = tvoje Vercel URL
```

---

## Environment variables

```bash
# Neon Database (z Neon Console → Connection Details)
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx-pooler.xxx.neon.tech/neondb?sslmode=require

# Neon Auth (z Neon Console → Auth tab)
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.xxx.neon.tech/neondb/auth

# App URLs (localhost pro dev, produkční URL pro Vercel)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_EMAIL=tvuj@email.com
```

---

## Klávesové zkratky

| Klávesa | Akce |
|---------|------|
| `n` | Nový nápad |
| `d` | Nová služba |
| `p` | Ping všech |
| `h` | Dashboard |
| `i` | Nápady |

---

## Soubory k prostudování

| Soubor | Obsah |
|--------|-------|
| `README.md` | Kompletní dokumentace |
| `neon/schema.sql` | Celé DB schéma pro novou instalaci |
| `neon/import-data.sql` | Migrace dat ze Supabase |
| `lib/db/schema.ts` | Drizzle ORM schema definice |
| `lib/auth/` | Neon Auth klient a server |
