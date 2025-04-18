#!/bin/bash
# Simple curl test for the API endpoint

echo "=== Testing API endpoint with curl ==="
echo "Testing POST /api/tracks/scheduler/sources"

# Create a test payload
TEST_PAYLOAD='{"source":"https://www.youtube.com/channel/UCf8GBn4oMPCCZKLhFazgYlA","type":"channel"}'

# Make the API request
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  http://localhost:3000/api/tracks/scheduler/sources \
  -v

echo ""
echo "=== Test Complete ===" 