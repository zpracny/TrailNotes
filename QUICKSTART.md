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
2. Název: trailnotes (nebo jiný)
3. NEVYTVÁŘEJ README (už máme)
4. Zkopíruj URL repozitáře
```

### 3. Propoj a pushni
```bash
git remote add origin https://github.com/TVUJ_USERNAME/trailnotes.git
git branch -M main
git push -u origin main
```

### 4. Deploy na Vercel
```
1. vercel.com → Add New Project
2. Import Git Repository → vyber trailnotes
3. Environment Variables → přidej:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ADMIN_EMAIL
4. Deploy
```

### 5. Nastav doménu (volitelné)
```
1. Vercel → Project Settings → Domains
2. Přidej: trailnotes.pracny.app
3. Nastav DNS u registrátora
```

### 6. Aktualizuj Supabase URLs
```
Authentication → URL Configuration:
- Site URL: https://trailnotes.pracny.app
- Redirect URLs: https://trailnotes.pracny.app/auth/callback
```

---

## Pro novou instalaci

### 1. Supabase
```
1. Vytvoř projekt na supabase.com
2. SQL Editor → spusť supabase/schema.sql
3. Authentication → Providers → Google → Enable
4. Zkopíruj API klíče z Project Settings → API
```

### 2. Google OAuth
```
1. console.cloud.google.com → Credentials → Create OAuth client
2. Redirect URI: https://XXX.supabase.co/auth/v1/callback
3. Zkopíruj Client ID + Secret do Supabase
```

### 3. Lokální vývoj
```bash
npm install
cp .env.local.example .env.local
# Doplň klíče do .env.local
npm run dev
```

### 4. Vercel deploy
```
1. Push na GitHub
2. Import do Vercel
3. Přidej env variables
4. V Supabase přidej produkční URL
```

---

## Pro upgrade existující DB

Spusť v Supabase SQL Editor:
```
supabase/migration-v2.sql
```

---

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
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
| `supabase/schema.sql` | Celé DB schéma pro novou instalaci |
| `supabase/migration-v2.sql` | Upgrade existující DB |
| `.env.local.example` | Šablona pro env variables |
