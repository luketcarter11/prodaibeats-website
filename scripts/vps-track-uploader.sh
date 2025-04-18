#!/bin/bash

# VPS Track Uploader Script
# This script runs on your VPS to:
# 1. Download new tracks from YouTube or other sources
# 2. Process them (extract audio, create cover images)
# 3. Store them in the proper directory structure
# 4. Update the tracks.json file with the new track info

# Configuration
DEPLOY_DIR="/var/www/prodai"
PUBLIC_AUDIO_DIR="$DEPLOY_DIR/public/audio"
PUBLIC_COVERS_DIR="$DEPLOY_DIR/public/covers"
TRACKS_JSON="$DEPLOY_DIR/public/tracks.json"
LOG_FILE="$DEPLOY_DIR/logs/track-uploader.log"
TEMP_DIR="/tmp/track-processing"

# Ensure directories exist
mkdir -p "$PUBLIC_AUDIO_DIR" "$PUBLIC_COVERS_DIR" "$DEPLOY_DIR/logs" "$TEMP_DIR"

# Log function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Initialize tracks.json if it doesn't exist
if [ ! -f "$TRACKS_JSON" ]; then
  log "Initializing tracks.json"
  echo "[]" > "$TRACKS_JSON"
fi

# Check for new tracks in source directory
# This could be adapted to fetch from YouTube, S3, or another source
process_new_tracks() {
  local source_dir="$1"
  log "Checking for new tracks in $source_dir"
  
  # Find all MP3 files in the source directory
  find "$source_dir" -name "*.mp3" | while read -r track_file; do
    track_filename=$(basename "$track_file")
    track_slug=$(echo "$track_filename" | sed 's/\.mp3$//' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    
    # Check if track already exists in tracks.json
    if grep -q "\"slug\": \"$track_slug\"" "$TRACKS_JSON"; then
      log "Track $track_slug already exists in tracks.json, skipping"
      continue
    fi
    
    log "Processing new track: $track_slug"
    
    # Create directories for the track
    mkdir -p "$PUBLIC_AUDIO_DIR/$track_slug"
    
    # Copy the MP3 file
    cp "$track_file" "$PUBLIC_AUDIO_DIR/$track_slug/audio.mp3"
    
    # Generate or copy cover image
    cover_file=$(find "$(dirname "$track_file")" -name "*.jpg" -o -name "*.png" | head -n 1)
    if [ -n "$cover_file" ]; then
      cp "$cover_file" "$PUBLIC_AUDIO_DIR/$track_slug/cover.jpg"
    else
      # Generate a default cover if none exists
      cp "$DEPLOY_DIR/public/images/default-cover.jpg" "$PUBLIC_AUDIO_DIR/$track_slug/cover.jpg"
    fi
    
    # Extract metadata
    title=$(echo "$track_filename" | sed 's/\.mp3$//')
    artist="ProDAI"
    
    # Generate track data
    track_data="{
      \"title\": \"$title\",
      \"slug\": \"$track_slug\",
      \"artist\": \"$artist\",
      \"duration\": \"3:30\",
      \"audio\": \"/audio/$track_slug/audio.mp3\",
      \"cover\": \"/audio/$track_slug/cover.jpg\",
      \"price\": 29.99,
      \"bpm\": 140,
      \"key\": \"Am\",
      \"tags\": [\"UK Drill\", \"Beat\"],
      \"downloadDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"
    }"
    
    # Add to tracks.json
    tmp_json=$(mktemp)
    jq ".[0:0] + [$track_data] + .[0:]" "$TRACKS_JSON" > "$tmp_json"
    mv "$tmp_json" "$TRACKS_JSON"
    
    log "Added $track_slug to tracks.json"
  done
}

# Main function
main() {
  log "Starting track uploader script"
  
  # Process tracks from various sources
  # Adapt these directories to where your tracks are stored
  process_new_tracks "/path/to/new/tracks"
  
  # You could add additional sources here
  # process_new_tracks "/another/path/to/tracks"
  
  log "Track uploader script completed"
}

# Run the main function
main 