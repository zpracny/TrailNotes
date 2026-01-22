# Podrobný návod na nastavení Audio Workeru

Tento návod tě provede kompletním nastavením Audio Workeru pro automatickou transkripci hlasových poznámek.

---

## Přehled kroků

1. [Nastavení Supabase databáze](#krok-1-nastavení-supabase-databáze)
2. [Nastavení Supabase Storage](#krok-2-nastavení-supabase-storage)
3. [Získání API klíčů](#krok-3-získání-api-klíčů)
4. [Příprava Raspberry Pi](#krok-4-příprava-raspberry-pi)
5. [Instalace Docker](#krok-5-instalace-docker)
6. [Deployment workeru](#krok-6-deployment-workeru)
7. [Testování](#krok-7-testování)
8. [Integrace s frontendem](#krok-8-integrace-s-frontendem)

---

## Krok 1: Nastavení Supabase databáze

### 1.1 Přihlášení do Supabase

1. Otevři prohlížeč a jdi na [https://app.supabase.com](https://app.supabase.com)
2. Přihlaš se do svého účtu (nebo vytvoř nový)
3. Vyber svůj projekt TrailNotes

### 1.2 Otevření SQL Editoru

1. V levém menu klikni na **SQL Editor** (ikona databáze)
2. Klikni na tlačítko **+ New query** vpravo nahoře

### 1.3 Vytvoření tabulky audio_notes

Zkopíruj a vlož následující SQL kód:

```sql
-- ============================================
-- 1. AUDIO_NOTES - Hlasové poznámky
-- ============================================
CREATE TABLE audio_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  audio_path TEXT NOT NULL,
  transcription TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_message TEXT
);

-- Indexy pro rychlé dotazy
CREATE INDEX idx_audio_notes_user_id ON audio_notes(user_id);
CREATE INDEX idx_audio_notes_status ON audio_notes(status);
CREATE INDEX idx_audio_notes_created_at ON audio_notes(created_at DESC);

-- ============================================
-- 2. RLS - Row Level Security
-- ============================================
ALTER TABLE audio_notes ENABLE ROW LEVEL SECURITY;

-- SELECT - pouze vlastní záznamy
CREATE POLICY "Users can view own audio notes"
  ON audio_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT - pouze pro sebe
CREATE POLICY "Users can insert own audio notes"
  ON audio_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE - pouze vlastní záznamy
CREATE POLICY "Users can update own audio notes"
  ON audio_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE - pouze vlastní záznamy
CREATE POLICY "Users can delete own audio notes"
  ON audio_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. REALTIME - Povolit realtime updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE audio_notes;
```

### 1.4 Spuštění SQL

1. Klikni na tlačítko **Run** (zelené tlačítko vpravo dole)
2. Počkej na hlášku "Success. No rows returned"
3. Ověř vytvoření tabulky:
   - V levém menu klikni na **Table Editor**
   - Měla by se zobrazit tabulka `audio_notes`

---

## Krok 2: Nastavení Supabase Storage

### 2.1 Vytvoření bucketu

1. V levém menu klikni na **Storage** (ikona složky)
2. Klikni na tlačítko **New bucket**
3. Vyplň:
   - **Name**: `audio-uploads`
   - **Public bucket**: ✅ Zaškrtni (worker potřebuje přístup)
4. Klikni na **Create bucket**

### 2.2 Nastavení Storage policies

1. Klikni na bucket `audio-uploads`
2. Klikni na záložku **Policies**
3. Klikni na **New policy**

#### Policy 1: Upload (INSERT)

1. Vyber **For full customization**
2. Vyplň:
   - **Policy name**: `Users can upload own audio`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**:
     ```sql
     (storage.foldername(name))[1] = auth.uid()::text
     ```
3. Klikni **Review** → **Save policy**

#### Policy 2: Read own files (SELECT pro authenticated)

1. Klikni **New policy** → **For full customization**
2. Vyplň:
   - **Policy name**: `Users can read own audio`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (storage.foldername(name))[1] = auth.uid()::text
     ```
3. Klikni **Review** → **Save policy**

#### Policy 3: Delete own files (DELETE)

1. Klikni **New policy** → **For full customization**
2. Vyplň:
   - **Policy name**: `Users can delete own audio`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (storage.foldername(name))[1] = auth.uid()::text
     ```
3. Klikni **Review** → **Save policy**

#### Policy 4: Public read (pro worker)

1. Klikni **New policy** → **For full customization**
2. Vyplň:
   - **Policy name**: `Public read access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**:
     ```sql
     true
     ```
3. Klikni **Review** → **Save policy**

### 2.3 Ověření policies

Po vytvoření bys měl vidět 4 policies:
- `Users can upload own audio` (INSERT)
- `Users can read own audio` (SELECT)
- `Users can delete own audio` (DELETE)
- `Public read access` (SELECT)

---

## Krok 3: Získání API klíčů

### 3.1 Otevření nastavení API

1. V levém menu klikni na **Project Settings** (ikona ozubeného kola dole)
2. Klikni na **API** v podmenu

### 3.2 Zapiš si hodnoty

Na stránce najdeš:

| Hodnota | Kde najít | Příklad |
|---------|-----------|---------|
| **Project URL** | Sekce "Project URL" | `https://abcdefgh.supabase.co` |
| **service_role key** | Sekce "Project API keys" → `service_role` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

⚠️ **DŮLEŽITÉ UPOZORNĚNÍ:**
- Použij `service_role` key, **NE** `anon` key
- `service_role` key má plný přístup k databázi bez RLS omezení
- **Nikdy** ho nezveřejňuj, necommituj do Gitu, nesdílej
- Používej ho pouze na serveru (worker)

### 3.3 Zkopíruj si hodnoty

Zapiš si někam bezpečně:
```
SUPABASE_URL=https://tvuj-projekt.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx
```

---

## Krok 4: Příprava Raspberry Pi

### 4.1 Požadavky na hardware

- **Model**: Raspberry Pi 4 (doporučeno 4GB RAM, minimum 2GB)
- **OS**: Raspberry Pi OS 64-bit (Bullseye nebo novější)
- **Storage**: microSD 32GB+ nebo USB SSD (doporučeno)
- **Síť**: Ethernet nebo WiFi

### 4.2 Připojení k Raspberry Pi

```bash
# Z tvého počítače se připoj přes SSH
ssh pi@raspberrypi.local

# Nebo použij IP adresu
ssh pi@192.168.1.xxx
```

Výchozí heslo je `raspberry` (změň ho příkazem `passwd`)

### 4.3 Aktualizace systému

```bash
# Aktualizuj seznam balíčků
sudo apt-get update

# Aktualizuj nainstalované balíčky
sudo apt-get upgrade -y

# Restartuj (volitelné, ale doporučené po upgrade)
sudo reboot
```

Po restartu se znovu připoj přes SSH.

### 4.4 Nastavení swap (pro více paměti)

Whisper potřebuje hodně RAM. Přidej swap pro jistotu:

```bash
# Vypni aktuální swap
sudo dphys-swapfile swapoff

# Uprav konfiguraci
sudo nano /etc/dphys-swapfile
```

Najdi řádek `CONF_SWAPSIZE` a změň na:
```
CONF_SWAPSIZE=2048
```

Ulož soubor (Ctrl+O, Enter, Ctrl+X) a aktivuj:

```bash
# Aplikuj změny
sudo dphys-swapfile setup

# Zapni swap
sudo dphys-swapfile swapon

# Ověř
free -h
# Mělo by ukázat Swap: 2.0Gi
```

---

## Krok 5: Instalace Docker

### 5.1 Instalace Docker Engine

```bash
# Stáhni instalační skript
curl -fsSL https://get.docker.com -o get-docker.sh

# Spusť instalaci (trvá několik minut)
sudo sh get-docker.sh

# Přidej uživatele do docker skupiny
sudo usermod -aG docker $USER
```

### 5.2 Odhlášení a přihlášení

```bash
# Odhlásit se
exit

# Znovu se přihlásit
ssh pi@raspberrypi.local
```

### 5.3 Ověření instalace

```bash
# Zkontroluj verzi
docker --version
# Mělo by ukázat: Docker version 24.x.x nebo novější

# Otestuj Docker
docker run hello-world
# Mělo by stáhnout image a vypsat "Hello from Docker!"
```

### 5.4 Instalace Docker Compose

```bash
# Nainstaluj Docker Compose plugin
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Ověř instalaci
docker compose version
# Mělo by ukázat: Docker Compose version v2.x.x
```

---

## Krok 6: Deployment workeru

### 6.1 Vytvoření adresáře

```bash
# Vytvoř adresář pro worker
mkdir -p ~/audio-worker
cd ~/audio-worker
```

### 6.2 Vytvoření souborů

#### worker.py

```bash
nano worker.py
```

Vlož obsah souboru `worker.py` z projektu a ulož (Ctrl+O, Enter, Ctrl+X).

#### requirements.txt

```bash
nano requirements.txt
```

Vlož:
```
supabase>=2.0.0
openai-whisper>=20231117
ffmpeg-python>=0.2.0
python-dotenv>=1.0.0
```

Ulož soubor.

#### Dockerfile

```bash
nano Dockerfile
```

Vlož:
```dockerfile
FROM python:3.11-slim

LABEL maintainer="TrailNotes"
LABEL description="Audio transcription worker using Whisper"

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .

CMD ["python", "-u", "worker.py"]
```

Ulož soubor.

#### docker-compose.yml

```bash
nano docker-compose.yml
```

Vlož:
```yaml
version: '3.8'

services:
  audio-worker:
    build: .
    container_name: audio-worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - PYTHONUNBUFFERED=1
    volumes:
      - whisper-cache:/root/.cache/whisper

volumes:
  whisper-cache:
```

Ulož soubor.

### 6.3 Vytvoření konfigurace (.env)

```bash
# Vytvoř .env soubor
nano .env
```

Vlož a vyplň své hodnoty:
```env
# Supabase připojení
SUPABASE_URL=https://tvuj-projekt.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Whisper konfigurace
WHISPER_MODEL=base
LANGUAGE=cs
POLL_INTERVAL=10
```

Ulož soubor (Ctrl+O, Enter, Ctrl+X).

### 6.4 Zabezpečení .env souboru

⚠️ **DŮLEŽITÉ - Bezpečnostní krok:**

```bash
# Nastav oprávnění - pouze vlastník může číst/zapisovat
chmod 600 .env

# Ověř oprávnění
ls -la .env
# Mělo by ukázat: -rw------- 1 pi pi ... .env
```

Toto zajistí, že:
- Pouze vlastník souboru (ty) může číst obsah
- Ostatní uživatelé na systému nemají přístup
- `.env` soubor není čitelný pro jiné procesy

### 6.5 Ověření struktury

```bash
ls -la
```

Měl bys vidět:
```
drwxr-xr-x 2 pi pi 4096 ... .
drwxr-xr-x 5 pi pi 4096 ... ..
-rw-r--r-- 1 pi pi  xxx ... Dockerfile
-rw-r--r-- 1 pi pi  xxx ... docker-compose.yml
-rw------- 1 pi pi  xxx ... .env          # Povšimni si oprávnění!
-rw-r--r-- 1 pi pi  xxx ... requirements.txt
-rw-r--r-- 1 pi pi  xxx ... worker.py
```

### 6.6 Build Docker image

```bash
# Build image (trvá 10-20 minut na RPi)
docker compose build
```

Uvidíš průběh stahování a instalace. Počkej na dokončení.

### 6.7 Spuštění workeru

```bash
# Spusť worker na pozadí
docker compose up -d

# Ověř, že běží
docker compose ps
```

Měl bys vidět:
```
NAME           SERVICE        STATUS          PORTS
audio-worker   audio-worker   Up 10 seconds
```

### 6.8 Zobrazení logů

```bash
# Sleduj logy v reálném čase
docker compose logs -f
```

Měl bys vidět:
```
audio-worker  | 2024-01-15 10:23:45 | INFO | ==================================================
audio-worker  | 2024-01-15 10:23:45 | INFO | Audio Worker starting...
audio-worker  | 2024-01-15 10:23:45 | INFO | ==================================================
audio-worker  | 2024-01-15 10:23:45 | INFO | Supabase URL: https://xxx.supabase.co
audio-worker  | 2024-01-15 10:23:45 | INFO | Whisper model: base
audio-worker  | 2024-01-15 10:23:45 | INFO | Poll interval: 10s
audio-worker  | 2024-01-15 10:23:45 | INFO | Language: cs
audio-worker  | 2024-01-15 10:23:50 | INFO | Loading Whisper model: base
audio-worker  | 2024-01-15 10:24:15 | INFO | Whisper model loaded successfully
audio-worker  | 2024-01-15 10:24:15 | INFO | Worker started, polling every 10s
```

Ukonči sledování logů pomocí Ctrl+C (worker poběží dál).

---

## Krok 7: Testování

### 7.1 Vytvoření testovacího audio souboru

Na svém počítači nahraj krátké audio (např. pomocí telefonu) a ulož jako `.webm` nebo `.mp3`.

### 7.2 Upload testovacího souboru do Storage

1. V Supabase Dashboard jdi do **Storage**
2. Klikni na bucket `audio-uploads`
3. Klikni na **Create folder** a vytvoř složku s názvem `test-user`
4. Vstup do složky `test-user`
5. Klikni na **Upload files** a nahraj své testovací audio

### 7.3 Vytvoření testovacího záznamu v DB

V Supabase **SQL Editor** spusť:

```sql
-- Vytvoř testovací záznam
INSERT INTO audio_notes (user_id, audio_path, status)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- testovací user ID
  'test-user/tvuj-soubor.webm',             -- ZMĚŇ na skutečný název souboru!
  'pending'
);

-- Ověř vytvoření
SELECT * FROM audio_notes;
```

### 7.4 Sledování zpracování

Na Raspberry Pi:

```bash
docker compose logs -f
```

Měl bys vidět:
```
audio-worker  | 2024-01-15 10:25:00 | INFO | Found 1 pending audio note(s)
audio-worker  | 2024-01-15 10:25:00 | INFO | Processing: abc-123 (test-user/tvuj-soubor.webm)
audio-worker  | 2024-01-15 10:25:15 | INFO | Transcribed abc-123: "Obsah tvé nahrávky..."
```

### 7.5 Ověření výsledku

V Supabase **SQL Editor**:

```sql
SELECT id, status, transcription, error_message
FROM audio_notes
ORDER BY created_at DESC
LIMIT 1;
```

Měl bys vidět:
- `status`: `done`
- `transcription`: Text přepsaný z nahrávky

---

## Krok 8: Integrace s frontendem

### 8.1 Vytvoření server action

Vytvoř soubor `actions/audio.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAudioNote(audioPath: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('audio_notes')
    .insert({
      user_id: user.id,
      audio_path: audioPath,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/audio-notes')
  return data
}

export async function getAudioNotes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audio_notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function deleteAudioNote(id: string) {
  const supabase = await createClient()

  // Získej audio_path pro smazání ze storage
  const { data: note } = await supabase
    .from('audio_notes')
    .select('audio_path')
    .eq('id', id)
    .single()

  // Smaž soubor ze storage
  if (note?.audio_path) {
    await supabase.storage
      .from('audio-uploads')
      .remove([note.audio_path])
  }

  // Smaž záznam z DB
  const { error } = await supabase
    .from('audio_notes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/audio-notes')
}
```

### 8.2 Komponenta pro nahrávání

Příklad použití v React komponentě:

```typescript
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAudioNote } from '@/actions/audio'

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    chunks.current = []

    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data)
    }

    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' })
      await uploadAudio(blob)
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const filename = `${Date.now()}.webm`
    const path = `${user.id}/${filename}`

    // Upload do Storage
    const { error: uploadError } = await supabase.storage
      .from('audio-uploads')
      .upload(path, blob)

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      setIsUploading(false)
      return
    }

    // Vytvoř záznam v DB
    await createAudioNote(path)
    setIsUploading(false)
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isUploading}
    >
      {isUploading ? 'Nahrávám...' : isRecording ? 'Stop' : 'Nahrát'}
    </button>
  )
}
```

---

## Užitečné příkazy

### Správa workeru

```bash
# Zobraz stav
docker compose ps

# Zobraz logy
docker compose logs -f

# Restart workeru
docker compose restart

# Stop workeru
docker compose down

# Start workeru
docker compose up -d
```

### Rebuild po změnách

```bash
# Rebuild a restart
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Debugging

```bash
# Shell do kontejneru
docker compose exec audio-worker bash

# Manuální test připojení k Supabase
docker compose exec audio-worker python -c "
from supabase import create_client
import os
client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
result = client.table('audio_notes').select('*').limit(5).execute()
print(f'Found {len(result.data)} records')
"
```

---

## Troubleshooting

### Worker se nespustí

```bash
# Zkontroluj logy
docker compose logs

# Ověř .env soubor
cat .env  # (pouze pokud jsi vlastník)
```

### "SUPABASE_URL is not set"

```bash
# Ověř, že .env existuje a má správný obsah
ls -la .env
cat .env
```

### Out of Memory

```bash
# Použij menší model
nano .env
# Změň WHISPER_MODEL=tiny

# Restart
docker compose restart
```

### Whisper stahování selhává

```bash
# Smaž cache a zkus znovu
docker compose down
docker volume rm audio-worker_whisper-cache
docker compose up -d
```

### Storage download selhává

1. Ověř, že bucket `audio-uploads` existuje v Supabase
2. Ověř, že cesta v `audio_path` odpovídá skutečnému souboru
3. Ověř, že používáš `service_role` key (ne `anon`)

---

## Automatický start po restartu RPi

Worker se automaticky spustí po restartu díky `restart: unless-stopped` v docker-compose.yml.

Ověření:
```bash
# Restartuj RPi
sudo reboot

# Po restartu zkontroluj
docker compose ps
```
