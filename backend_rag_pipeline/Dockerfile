FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Git and PDF processing
RUN apt-get update && apt-get install -y \
    git \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data directory exists
RUN mkdir -p data

# Set environment variables for unbuffered logging
ENV PYTHONUNBUFFERED=1

# Set the entrypoint
CMD ["python", "-u", "docker_entrypoint.py"]
