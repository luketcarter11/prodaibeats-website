#!/bin/bash
# Script to back up the original route file and replace it with the fixed version

# Define file paths
ORIGINAL="app/api/tracks/scheduler/sources/route.ts"
FIXED="app/api/tracks/scheduler/sources/route.fixed.ts"
BACKUP="app/api/tracks/scheduler/sources/route.ts.backup"

echo "=== Applying API Route Fix ==="

# Check if files exist
if [ ! -f "$ORIGINAL" ]; then
  echo "❌ Original route file not found: $ORIGINAL"
  exit 1
fi

if [ ! -f "$FIXED" ]; then
  echo "❌ Fixed route file not found: $FIXED"
  exit 1
fi

# Create backup
echo "📂 Creating backup of original file..."
cp "$ORIGINAL" "$BACKUP"
echo "✅ Backup created: $BACKUP"

# Replace original with fixed version
echo "🔄 Replacing with fixed version..."
cp "$FIXED" "$ORIGINAL"
echo "✅ Route file updated"

echo ""
echo "=== Fix Applied ==="
echo "Restart your Next.js server to apply the changes"

# Test the API after fix
echo ""
echo "Would you like to test the API now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Running API test..."
  node scripts/test-scheduler-source.js
else
  echo ""
  echo "To test the API later, run:"
  echo "node scripts/test-scheduler-source.js"
fi

echo ""
echo "If you need to restore the original file, run:"
echo "cp \"$BACKUP\" \"$ORIGINAL\"" 