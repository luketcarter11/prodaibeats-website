#!/bin/bash

# This script tests the cron job endpoint with the correct secret key

echo "Testing scheduler cron job endpoint with secret key..."

# Using the secret key from .env.local
curl "http://localhost:3000/api/cron/scheduler?key=jhwefbepufrbfureifqphwregru8ehg" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\nTesting with incorrect key (should return 401 Unauthorized)..."

curl "http://localhost:3000/api/cron/scheduler?key=wrong-key" \
  -H "Content-Type: application/json" \
  -v 