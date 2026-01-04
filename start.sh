#!/bin/bash

# Development Scripts for Source Code Analysis Tool

echo "🚀 Source Code Analysis Tool - Development Scripts"
echo ""
echo "Choose your environment:"
echo "1) Local development (no Docker)"
echo "2) Local Docker development"
echo "3) Production (Hostinger VPS)"
echo ""

read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "🔧 Starting local development..."
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:3000"
    echo ""
    echo "Run these commands in separate terminals:"
    echo "cd backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
    echo "cd frontend && npm run dev"
    ;;
  2)
    echo "🐳 Starting local Docker development..."
    if [ ! -f .env.docker ]; then
      echo "❌ Error: .env.docker not found!"
      echo "Please copy .env.docker.example to .env.docker and configure your credentials."
      exit 1
    fi
    docker compose -f docker-compose.local.yml up -d --build
    echo "Frontend: http://localhost:3509"
    echo "Backend: http://localhost:8359"
    ;;
  3)
    echo "☁️ Starting production deployment..."
    if [ ! -f .env.production ]; then
      echo "❌ Error: .env.production not found!"
      echo "Please copy .env.production.example to .env.production and configure your credentials."
      exit 1
    fi
    docker compose -f docker-compose.prod.yml up -d --build
    echo "Frontend: http://localhost:3509"
    echo "Backend: http://localhost:8359"
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
