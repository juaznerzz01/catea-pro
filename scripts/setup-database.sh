#!/bin/bash
set -e  # Exit on any error

echo "🚀 ChatIA Database Setup Script v1.0"
echo "======================================"
echo ""

# Step 1: Verify Docker is running
echo "📦 [1/8] Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running!"
    echo "   Please start Docker and try again."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Step 2: Check if PostgreSQL container is running
echo "🐘 [2/8] Checking PostgreSQL container..."
if ! docker ps | grep -q "chatia_postgres_dev"; then
    echo "⚠️  PostgreSQL container not running. Starting it..."
    docker-compose up -d postgres
    echo "⏳ Waiting 5 seconds for PostgreSQL to initialize..."
    sleep 5
else
    echo "✅ PostgreSQL container is running"
fi
echo ""

# Step 3: Wait for PostgreSQL to be ready
echo "⏳ [3/8] Waiting for PostgreSQL to accept connections..."
MAX_TRIES=30
for i in $(seq 1 $MAX_TRIES); do
    if docker exec chatia_postgres_dev pg_isready -U chatia > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq $MAX_TRIES ]; then
        echo "❌ ERROR: PostgreSQL did not become ready in time"
        exit 1
    fi
    sleep 1
done
echo ""

# Step 4: Create database if it doesn't exist
echo "🗄️  [4/8] Creating database 'chatia_dev' if not exists..."
DB_EXISTS=$(docker exec chatia_postgres_dev psql -U chatia -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='chatia_dev'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" != "1" ]; then
    echo "⚠️  Database 'chatia_dev' does not exist. Creating..."
    docker exec chatia_postgres_dev psql -U chatia -d postgres -c "CREATE DATABASE chatia_dev;" > /dev/null 2>&1
    echo "✅ Database 'chatia_dev' created successfully"
else
    echo "✅ Database 'chatia_dev' already exists"
fi
echo ""

# Step 5: Check if backend is built
echo "🔨 [5/8] Checking backend build..."
if [ ! -d "backend/dist" ] || [ ! -f "backend/dist/server.js" ]; then
    echo "⚠️  Backend not built. Building now..."
    cd backend
    npm run build
    cd ..
    echo "✅ Backend built successfully"
else
    echo "✅ Backend is already built"
fi
echo ""

# Step 6: Run migrations
echo "🔄 [6/8] Running database migrations..."
cd backend
npm run db:migrate
cd ..
echo "✅ Migrations completed"
echo ""

# Step 7: Run seeders
echo "🌱 [7/8] Running database seeders..."
cd backend
npm run db:seed
cd ..
echo "✅ Seeders completed"
echo ""

# Step 8: Verify super admin exists
echo "👤 [8/8] Verifying super admin user..."
ADMIN_EXISTS=$(docker exec chatia_postgres_dev psql -U chatia -d chatia_dev -tAc "SELECT 1 FROM \"Users\" WHERE email='admin@admin.com' LIMIT 1" 2>/dev/null || echo "")

if [ "$ADMIN_EXISTS" = "1" ]; then
    echo "✅ Super admin user verified"
    echo ""
    echo "======================================"
    echo "✅ Setup completed successfully!"
    echo "======================================"
    echo ""
    echo "📋 Login credentials:"
    echo "   Email:    admin@admin.com"
    echo "   Password: 123456"
    echo ""
    echo "🚀 You can now start the backend with:"
    echo "   cd backend && npm run dev:server"
    echo ""
else
    echo "⚠️  WARNING: Super admin user not found!"
    echo "   Please check the seeders."
    exit 1
fi
