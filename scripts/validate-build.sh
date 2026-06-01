#!/bin/bash
set -e  # Exit on any error

echo "🔍 ChatIA Build Validation Script v1.0"
echo "======================================="
echo ""

BUILD_DIR="backend/dist"
CRITICAL_FILES=(
    "server.js"
    "app.js"
    "config/database.js"
    "database/migrations"
    "database/seeds"
)

echo "📁 [1/3] Checking if build directory exists..."
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ ERROR: Build directory '$BUILD_DIR' does not exist!"
    echo "   Run: cd backend && npm run build"
    exit 1
fi
echo "✅ Build directory exists"
echo ""

echo "📋 [2/3] Validating critical files..."
ALL_EXIST=true

for file in "${CRITICAL_FILES[@]}"; do
    FULL_PATH="$BUILD_DIR/$file"
    if [ -e "$FULL_PATH" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING!"
        ALL_EXIST=false
    fi
done

echo ""

if [ "$ALL_EXIST" = false ]; then
    echo "❌ ERROR: Some critical files are missing from build!"
    echo "   Try: cd backend && rm -rf dist && npm run build"
    exit 1
fi

echo "✅ All critical files present"
echo ""

echo "🗄️  [3/3] Checking Sequelize configuration..."
if [ ! -f "$BUILD_DIR/config/database.js" ]; then
    echo "❌ ERROR: database.js not found in dist/config/"
    exit 1
fi

# Check if migrations folder has files
MIGRATION_COUNT=$(find "$BUILD_DIR/database/migrations" -type f -name "*.js" 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "⚠️  WARNING: No migration files found in dist/database/migrations/"
    echo "   This might indicate build issues with TypeScript compilation"
else
    echo "✅ Found $MIGRATION_COUNT migration files"
fi

echo ""
echo "======================================="
echo "✅ Build validation passed!"
echo "======================================="
echo ""
echo "ℹ️  Build info:"
echo "   Location: $BUILD_DIR"
echo "   Migrations: $MIGRATION_COUNT files"
echo ""
