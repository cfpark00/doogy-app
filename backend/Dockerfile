FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Cloud Run sets PORT environment variable
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}