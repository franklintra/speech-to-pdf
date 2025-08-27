FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    python-multipart==0.0.6 \
    python-jose[cryptography]==3.3.0 \
    passlib==1.7.4 \
    bcrypt==4.0.1 \
    sqlalchemy==2.0.23 \
    python-dotenv==1.0.0 \
    deepgram-sdk==3.0.0 \
    python-docx==1.1.0 \
    reportlab==4.0.7 \
    aiofiles==23.2.1 \
    alembic==1.12.1 \
    psycopg2-binary==2.9.9 \
    slowapi==0.1.9 \
    pydantic[email]>=2.11.7

# Copy application code
COPY app ./app
COPY init_db.py ./

# Create directories for uploads
RUN mkdir -p /data/uploads/audio /data/uploads/docs /data/uploads/pdfs

# Set environment variables
ENV UPLOAD_DIR=/data/uploads

# Create a startup script
RUN echo '#!/bin/sh\n\
# Fix postgres:// to postgresql:// for SQLAlchemy compatibility\n\
if [ ! -z "$DATABASE_URL" ]; then\n\
  export DATABASE_URL=$(echo $DATABASE_URL | sed "s/^postgres:/postgresql:/")\n\
fi\n\
python init_db.py\n\
uvicorn app.main:app --host 0.0.0.0 --port 8080\n' > /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 8080

# Run the application
CMD ["/app/start.sh"]