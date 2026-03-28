#!/bin/bash
# Quick start script for Mortgage Broker App

set -e

echo "🏠 Mortgage Broker App — Quick Start"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    echo "   Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✅ Docker found"
echo ""

# Start Docker
echo "🚀 Starting Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if postgres is ready
DB_READY=false
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U mortgage_user > /dev/null 2>&1; then
        DB_READY=true
        break
    fi
    echo "   Attempt $i/30..."
    sleep 1
done

if [ "$DB_READY" = false ]; then
    echo "❌ Database failed to start. Check logs:"
    echo "   docker-compose logs postgres"
    exit 1
fi

echo "✅ Database is ready"
echo ""

# Show status
echo "📊 Container Status:"
docker-compose ps
echo ""

# Show endpoints
echo "🌐 Endpoints:"
echo "   Backend API:     http://localhost:5000"
echo "   API Docs:        http://localhost:5000/api"
echo "   Health Check:    http://localhost:5000/health"
echo "   Frontend:        http://localhost:3000 (once built)"
echo ""

# Show test endpoints
echo "🧪 Test the API:"
echo ""
echo "   1. Check health:"
echo "      curl http://localhost:5000/health"
echo ""
echo "   2. Register a user:"
echo "      curl -X POST http://localhost:5000/api/auth/register \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"test@example.com\",\"name\":\"Test User\",\"password\":\"password\"}'"
echo ""
echo "   3. Get mortgage deals:"
echo "      curl -X POST http://localhost:5000/api/deals/calculate \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"propertyValue\":300000,\"deposit\":60000,\"termYears\":25,\"grossIncome\":55000}'"
echo ""

echo "📚 Documentation:"
echo "   README.md                 — Full project overview"
echo "   ARCHITECTURE.md           — What's been built & next steps"
echo "   MONEYFACTS_INTEGRATION.md — How to connect real API"
echo ""

echo "📥 To build the frontend:"
echo "   cd client"
echo "   npm install"
echo "   npm run dev"
echo ""

echo "🛑 To stop everything:"
echo "   docker-compose down"
echo ""

echo "✨ All set! Start testing the API."
