# ============================================
# Apex Backend - Django + Gunicorn
# ============================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies (for opencv, pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create directories
RUN mkdir -p /app/staticfiles /app/media /app/data

# Copy SQLite DB to data volume location if it exists
# In production, the DB lives in /app/data/ so it persists across rebuilds
RUN if [ -f /app/db.sqlite3 ]; then cp /app/db.sqlite3 /app/data/db.sqlite3; fi

# Collect static files
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Use data volume for SQLite so it persists\n\
if [ ! -f /app/data/db.sqlite3 ]; then\n\
    echo "Initializing database..."\n\
fi\n\
\n\
# Run migrations\n\
python manage.py migrate --noinput\n\
\n\
# Collect static files\n\
python manage.py collectstatic --noinput\n\
\n\
# Start Gunicorn\n\
exec gunicorn apex_backend.wsgi:application \\\n\
    --bind 0.0.0.0:8000 \\\n\
    --workers 3 \\\n\
    --timeout 120 \\\n\
    --access-logfile - \\\n\
    --error-logfile -\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
