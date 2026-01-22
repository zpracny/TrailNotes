# ============================================
# Audio Worker - Dockerfile
# ============================================
# Optimalizováno pro Raspberry Pi (ARM64)
# Funguje i na x86_64
# ============================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="TrailNotes"
LABEL description="Audio transcription worker using Whisper"

# Systémové závislosti
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Pracovní adresář
WORKDIR /app

# Kopíruj requirements a nainstaluj závislosti
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopíruj worker skript
COPY worker.py .

# Pre-download Whisper model (volitelné, urychlí start)
# ARG WHISPER_MODEL=base
# RUN python -c "import whisper; whisper.load_model('${WHISPER_MODEL}')"

# Spusť worker
CMD ["python", "-u", "worker.py"]
