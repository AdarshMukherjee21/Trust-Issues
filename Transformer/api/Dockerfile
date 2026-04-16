# Use the official slim image - it is the best choice for ML workloads
FROM python:3.9-slim

# Set environment variables to save space and improve logging
# 1. Stop Python from generating .pyc files
# 2. Force Python logs to stream directly to the terminal without buffering
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NLTK_DATA=/usr/local/share/nltk_data

WORKDIR /app

COPY requirements.txt .

# Install dependencies and download NLTK data in a SINGLE layer
# We also explicitly delete the leftover NLTK .zip files to reclaim MBs of space
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m nltk.downloader -d ${NLTK_DATA} punkt punkt_tab stopwords &&  \
    find ${NLTK_DATA} -name "*.zip" -type f -delete

# Copy your actual application code and model files
COPY app.py .
COPY sub_modules/ ./sub_modules/
COPY pkl_files/ ./pkl_files/

# We use $PORT so Railway/Cloud Run can inject its own port, defaulting to 8000 for local testing
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]