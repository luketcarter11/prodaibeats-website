#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DOWNLOADER_PATH="$SCRIPT_DIR/downloadTracks.js"

# Check if the script file exists in the expected location
if [ ! -f "$DOWNLOADER_PATH" ]; then
  echo "ERROR: downloadTracks.js not found at $DOWNLOADER_PATH"
  echo "Make sure this script is in the same directory as downloadTracks.js"
  exit 1
fi

# Find Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  echo "ERROR: Node.js not found. Please install Node.js."
  exit 1
fi

echo "===== YouTube Music Auto Downloader ====="
echo "Script will run downloadTracks.js every 2 hours"
echo "Started at: $(date)"
echo "Using Node.js at: $NODE_PATH"
echo "Downloader script: $DOWNLOADER_PATH"
echo "Press Ctrl+C to stop"
echo "========================================"

# Loop forever
while true; do
  echo ""
  echo "$(date) - Running track downloader..."
  
  # Run the downloader script with explicit node path
  "$NODE_PATH" "$DOWNLOADER_PATH"
  
  # Get exit code
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -ne 0 ]; then
    echo "WARNING: Downloader exited with code $EXIT_CODE"
  fi
  
  # Calculate next run time
  NEXT_RUN=$(date -d "now + 2 hours" "+%H:%M:%S" 2>/dev/null || date -v+2H "+%H:%M:%S")
  
  echo "$(date) - Downloader finished. Next run at $NEXT_RUN"
  echo "Sleeping for 2 hours..."
  
  # Sleep for 2 hours (7200 seconds)
  sleep 7200
done 