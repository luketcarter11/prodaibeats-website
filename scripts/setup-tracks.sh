#!/bin/bash

# This script sets up symlinks for all tracks to be accessible in the public directory

# Create public/tracks directory if it doesn't exist
mkdir -p public/tracks

# Loop through all track directories
for track_dir in tracks/*/; do
  # Extract track name from directory path
  track_name=$(basename "$track_dir")
  
  # Create directory in public/tracks for this track if it doesn't exist
  mkdir -p "public/tracks/$track_name"
  
  # Copy or link the cover image
  if [ -f "$track_dir/cover.jpg" ]; then
    cp "$track_dir/cover.jpg" "public/tracks/$track_name/"
    echo "Copied cover image for $track_name"
  else
    echo "Warning: No cover image found for $track_name"
  fi
  
  # Copy or link the MP3 file and rename it to audio.mp3
  if [ -f "$track_dir/$track_name.mp3" ]; then
    cp "$track_dir/$track_name.mp3" "public/tracks/$track_name/audio.mp3"
    echo "Copied and renamed MP3 for $track_name"
  else
    echo "Warning: No MP3 file found for $track_name"
  fi
done

echo "Setup complete! Track files are now accessible under /tracks/[track-name]/audio.mp3" 