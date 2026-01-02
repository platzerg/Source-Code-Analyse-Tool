# Use Python 3.12 slim image
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Change ownership to non-root user
RUN chown -R appuser:appuser /app && \
    chown -R appuser:appuser /home/appuser && \
    chown -R appuser:appuser /app/data

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health', timeout=5)"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
