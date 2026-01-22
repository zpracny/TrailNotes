#!/usr/bin/env python3
"""
Audio Worker - Whisper Transkripce
==================================
Sleduje Supabase DB, stahuje audio soubory a přepisuje je pomocí Whisper.
"""

import os
import sys
import time
import logging
import tempfile
from datetime import datetime
from pathlib import Path

import whisper
from supabase import create_client, Client

# ============================================
# Konfigurace
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "10"))
LANGUAGE = os.getenv("LANGUAGE", "cs")
STORAGE_BUCKET = "audio-uploads"

# ============================================
# Logging
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ============================================
# Validace konfigurace
# ============================================

def validate_config():
    """Ověří, že jsou nastaveny všechny povinné proměnné."""
    if not SUPABASE_URL:
        logger.error("SUPABASE_URL is not set")
        sys.exit(1)
    if not SUPABASE_SERVICE_KEY:
        logger.error("SUPABASE_SERVICE_KEY is not set")
        sys.exit(1)

    logger.info(f"Supabase URL: {SUPABASE_URL}")
    logger.info(f"Whisper model: {WHISPER_MODEL}")
    logger.info(f"Poll interval: {POLL_INTERVAL}s")
    logger.info(f"Language: {LANGUAGE}")

# ============================================
# Supabase klient
# ============================================

def get_supabase_client() -> Client:
    """Vytvoří Supabase klienta s service_role přístupem."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================
# Whisper model
# ============================================

def load_whisper_model():
    """Načte Whisper model."""
    logger.info(f"Loading Whisper model: {WHISPER_MODEL}")
    try:
        model = whisper.load_model(WHISPER_MODEL)
        logger.info("Whisper model loaded successfully")
        return model
    except Exception as e:
        logger.error(f"Failed to load Whisper model: {e}")
        sys.exit(1)

# ============================================
# Zpracování audio
# ============================================

def get_pending_notes(supabase: Client) -> list:
    """Získá všechny pending audio záznamy."""
    try:
        response = supabase.table("audio_notes") \
            .select("*") \
            .eq("status", "pending") \
            .order("created_at", desc=False) \
            .execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Failed to fetch pending notes: {e}")
        return []

def update_note_status(supabase: Client, note_id: str, status: str,
                       transcription: str = None, error_message: str = None):
    """Aktualizuje stav záznamu v DB."""
    try:
        data = {"status": status}
        if transcription is not None:
            data["transcription"] = transcription
        if error_message is not None:
            data["error_message"] = error_message

        supabase.table("audio_notes") \
            .update(data) \
            .eq("id", note_id) \
            .execute()

        logger.info(f"Updated note {note_id}: status={status}")
    except Exception as e:
        logger.error(f"Failed to update note {note_id}: {e}")

def download_audio(supabase: Client, audio_path: str) -> str | None:
    """Stáhne audio soubor ze Supabase Storage do temp souboru."""
    try:
        # Stáhne soubor jako bytes
        response = supabase.storage \
            .from_(STORAGE_BUCKET) \
            .download(audio_path)

        # Určí příponu souboru
        ext = Path(audio_path).suffix or ".webm"

        # Uloží do temp souboru
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(response)
            return tmp.name

    except Exception as e:
        logger.error(f"Failed to download audio {audio_path}: {e}")
        return None

def transcribe_audio(model, audio_path: str) -> str | None:
    """Přepíše audio soubor pomocí Whisper."""
    try:
        # Transkripce
        result = model.transcribe(
            audio_path,
            language=LANGUAGE if LANGUAGE != "auto" else None,
            fp16=False,  # Pro kompatibilitu s CPU
        )

        text = result.get("text", "").strip()
        return text if text else None

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return None

def process_note(supabase: Client, model, note: dict):
    """Zpracuje jeden audio záznam."""
    note_id = note["id"]
    audio_path = note["audio_path"]

    logger.info(f"Processing: {note_id} ({audio_path})")

    # Označ jako processing
    update_note_status(supabase, note_id, "processing")

    # Stáhni audio
    tmp_file = download_audio(supabase, audio_path)
    if not tmp_file:
        update_note_status(supabase, note_id, "error",
                          error_message="Failed to download audio file")
        return

    try:
        # Přepiš pomocí Whisper
        transcription = transcribe_audio(model, tmp_file)

        if transcription:
            # Úspěch
            update_note_status(supabase, note_id, "done",
                              transcription=transcription)
            logger.info(f"Transcribed {note_id}: \"{transcription[:100]}...\""
                       if len(transcription) > 100 else
                       f"Transcribed {note_id}: \"{transcription}\"")
        else:
            # Prázdná transkripce
            update_note_status(supabase, note_id, "error",
                              error_message="Transcription returned empty result")
            logger.warning(f"Empty transcription for {note_id}")

    finally:
        # Smaž temp soubor
        try:
            os.unlink(tmp_file)
        except:
            pass

# ============================================
# Hlavní loop
# ============================================

def main():
    """Hlavní funkce workeru."""
    logger.info("=" * 50)
    logger.info("Audio Worker starting...")
    logger.info("=" * 50)

    # Validace
    validate_config()

    # Inicializace
    supabase = get_supabase_client()
    model = load_whisper_model()

    logger.info(f"Worker started, polling every {POLL_INTERVAL}s")
    logger.info("=" * 50)

    # Polling loop
    while True:
        try:
            # Získej pending záznamy
            pending = get_pending_notes(supabase)

            if pending:
                logger.info(f"Found {len(pending)} pending audio note(s)")

                # Zpracuj každý záznam
                for note in pending:
                    process_note(supabase, model, note)

            # Počkej před dalším pollováním
            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
