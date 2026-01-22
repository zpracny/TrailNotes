# Audio Worker - Whisper Transkripce

Python worker pro automatickou transkripci hlasových poznámek pomocí OpenAI Whisper.
Běží jako Docker kontejner na Raspberry Pi (nebo jiném serveru).

## Architektura

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend  │────>│ Supabase Storage│     │  Supabase DB    │
│  (Next.js)  │     │  audio-uploads  │     │  audio_notes    │
└─────────────┘     └────────┬────────┘     └────────┬────────┘
                             │                       │
                             │    ┌──────────────┐   │
                             └───>│ Audio Worker │<──┘
                                  │  (Python)    │
                                  │  - Whisper   │
                                  └──────────────┘
```

### Flow

1. **Frontend** nahraje audio do Supabase Storage (`audio-uploads/{user_id}/`)
2. **Frontend** vytvoří záznam v DB s `status: 'pending'`
3. **Worker** pravidelně kontroluje DB na `pending` záznamy
4. **Worker** stáhne audio, přepíše ho Whisperem, uloží text do DB
5. **Frontend** zobrazí transkripci (realtime update)

---

## Požadavky

- Python 3.10+
- Docker (pro deployment)
- Supabase projekt s:
  - Tabulkou `audio_notes`
  - Storage bucket `audio-uploads`

---

## Instalace

### 1. Nastavení Supabase

#### A) Spusť SQL migraci

V Supabase Dashboard → SQL Editor spusť obsah souboru:
```
supabase/migration-audio-notes.sql
```

#### B) Získej přístupové údaje

V Supabase Dashboard → Settings → API:

| Hodnota | Kde najít |
|---------|-----------|
| `SUPABASE_URL` | Project URL (např. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | `service_role` secret key (NE anon key!) |

> **DŮLEŽITÉ**: Použij `service_role` key, který obchází RLS a má plný přístup.

### 2. Konfigurace workeru

```bash
cd audio-worker
cp .env.example .env
```

Uprav `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WHISPER_MODEL=base
POLL_INTERVAL=10
```

### 3. Lokální spuštění (vývoj)

```bash
# Vytvoř virtuální prostředí
python -m venv venv
source venv/bin/activate  # Linux/Mac
# nebo: venv\Scripts\activate  # Windows

# Nainstaluj závislosti
pip install -r requirements.txt

# Spusť worker
python worker.py
```

### 4. Docker deployment (produkce)

```bash
# Build image
docker build -t audio-worker .

# Spusť kontejner
docker run -d \
  --name audio-worker \
  --restart unless-stopped \
  --env-file .env \
  audio-worker
```

#### Docker Compose (doporučeno)

```bash
docker-compose up -d
```

---

## Konfigurace

### Proměnné prostředí

| Proměnná | Popis | Default |
|----------|-------|---------|
| `SUPABASE_URL` | URL tvého Supabase projektu | (povinné) |
| `SUPABASE_SERVICE_KEY` | Service role API key | (povinné) |
| `WHISPER_MODEL` | Model Whisper (`tiny`, `base`, `small`, `medium`, `large`) | `base` |
| `POLL_INTERVAL` | Interval kontroly DB v sekundách | `10` |
| `LANGUAGE` | Jazyk pro transkripci (`cs`, `en`, `auto`) | `cs` |

### Whisper modely

| Model | Velikost | RAM | Rychlost | Kvalita |
|-------|----------|-----|----------|---------|
| `tiny` | 39 MB | ~1 GB | Velmi rychlý | Základní |
| `base` | 74 MB | ~1 GB | Rychlý | Dobrá |
| `small` | 244 MB | ~2 GB | Střední | Velmi dobrá |
| `medium` | 769 MB | ~5 GB | Pomalý | Výborná |
| `large` | 1550 MB | ~10 GB | Velmi pomalý | Nejlepší |

> **Pro Raspberry Pi 4 (4GB)** doporučuji `base` nebo `small`.

---

## Supabase Storage - Struktura

```
audio-uploads/
├── {user_id_1}/
│   ├── recording_1705123456.webm
│   └── recording_1705123789.webm
└── {user_id_2}/
    └── recording_1705124000.webm
```

### RLS Policies

Storage bucket má nastavené policies:
- **Upload**: Uživatel může nahrát pouze do své složky
- **Read**: Uživatel čte pouze svou složku
- **Public read**: Worker (s `service_role`) čte vše

---

## Databáze - Tabulka `audio_notes`

```sql
CREATE TABLE audio_notes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ,
  audio_path TEXT,        -- např. "{user_id}/recording.webm"
  transcription TEXT,     -- výsledek Whisper
  status TEXT,            -- 'pending' | 'processing' | 'done' | 'error'
  error_message TEXT      -- chybová hláška
);
```

### Stavy zpracování

```
pending ──> processing ──> done
                │
                └──> error (+ error_message)
```

---

## Logování

Worker loguje do stdout:

```
2024-01-15 10:23:45 | INFO | Worker started, polling every 10s
2024-01-15 10:23:45 | INFO | Using Whisper model: base
2024-01-15 10:23:55 | INFO | Found 2 pending audio notes
2024-01-15 10:23:55 | INFO | Processing: abc123 (user_1/recording.webm)
2024-01-15 10:24:12 | INFO | Transcribed abc123: "Toto je testovací nahrávka..."
2024-01-15 10:24:12 | INFO | Processing: def456 (user_2/recording.webm)
2024-01-15 10:24:28 | ERROR | Failed def456: Audio file not found
```

Pro Docker:
```bash
docker logs -f audio-worker
```

---

## Troubleshooting

### Worker nevidí pending záznamy

1. Ověř `SUPABASE_SERVICE_KEY` (musí být `service_role`, ne `anon`)
2. Zkontroluj RLS policies na tabulce `audio_notes`
3. Ověř, že tabulka existuje: `SELECT * FROM audio_notes;`

### Whisper hází chyby

1. Zkontroluj formát audio souboru (podporované: webm, mp3, wav, ogg, m4a)
2. Zkus menší model (`tiny` místo `base`)
3. Ověř dostatek RAM

### Storage download selhává

1. Ověř, že bucket `audio-uploads` existuje
2. Zkontroluj cestu v `audio_path` (musí odpovídat struktuře v bucketu)
3. Ověř `service_role` key má přístup

---

## Raspberry Pi deployment

### Doporučená konfigurace

- **Model**: Raspberry Pi 4 (4GB RAM minimum)
- **OS**: Raspberry Pi OS 64-bit (bullseye)
- **Storage**: SD karta 32GB+ nebo SSD

### Instalace Docker na RPi

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Odhlásit a přihlásit se znovu
```

### Automatický start po reboot

```bash
docker run -d \
  --name audio-worker \
  --restart always \
  --env-file /home/pi/audio-worker/.env \
  audio-worker
```

---

## Vývoj

### Testování lokálně

```bash
# Vytvoř testovací záznam v DB
INSERT INTO audio_notes (user_id, audio_path, status)
VALUES ('test-user-id', 'test/sample.webm', 'pending');

# Spusť worker
python worker.py
```

### Manuální transkripce

```python
import whisper
model = whisper.load_model("base")
result = model.transcribe("audio.webm", language="cs")
print(result["text"])
```

---

## Licence

MIT
