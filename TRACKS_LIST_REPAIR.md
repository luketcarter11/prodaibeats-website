# Tracks List Repair and Maintenance

This document describes the system for maintaining the integrity of the `tracks/list.json` file in R2 storage, which is critical for the proper functioning of the audio player.

## The Problem

The `tracks/list.json` file in our R2 bucket has been experiencing persistent corruption. This file is supposed to store a flat array of track IDs in the format:

```json
["track_abc123", "track_def456", ...]
```

However, we have been repeatedly encountering corrupted data like:

```json
[
  "\n",
  " ",
  "\"",
  ",",
  "0",
  "1",
  ...,
  "local_1746558691062_717",
  "test_12345"
]
```

This breaks the site's audio player because the frontend relies on this list to fetch and display tracks.

## The Solution

We've implemented a set of tools to fix and prevent this corruption:

1. **repair-list-json.ts** - Rebuilds the list from scratch by scanning the actual MP3 files
2. **verify-list-json.ts** - Checks if the current list is valid
3. **update-list-from-tracks.ts** - Safe wrapper to update the list after adding new tracks

### How It Works

#### 1. Strict Validation

All the tools enforce strict validation criteria:
- The list must be a valid JSON array
- All entries must be strings
- All entries must start with `track_`
- No other entries (like `local_` or individual characters) are allowed

#### 2. Rebuilding from Source

Rather than trying to fix a corrupted list, we rebuild it from scratch by:
- Scanning all the MP3 files in the `tracks/` folder
- Extracting valid IDs from the filenames
- Filtering out any invalid entries
- Creating a clean, sorted array
- Validating before uploading

#### 3. Automatic Cleanup

When corrupted entries are detected:
- Invalid entries are filtered out
- Only valid `track_` entries are kept
- Changes are logged for transparency

## Using the Scripts

### Regular Maintenance

```bash
# Verify the current state of tracks/list.json
npm run r2:verify-list

# If invalid, repair it:
npm run r2:repair-list
```

### After Adding New Tracks

After uploading new tracks to R2 (either manually or via the YouTube importer):

```bash
# Safely update the list to include any new tracks
npm run r2:update-list
```

### Complete System Repair

If you need to repair multiple R2 storage issues:

```bash
# Run the full repair process
npm run r2:repair
```

## Integration with Track Upload

The `youtubeTrackImporter.ts` file has been modified to ensure it no longer directly modifies the `tracks/list.json` file. Instead, it focuses solely on uploading individual track files and metadata.

After tracks are uploaded, you should run:

```bash
npm run r2:update-list
```

This ensures the list is safely updated without risking corruption.

## Implementation Details

### repair-list-json.ts

This script:
- Lists all MP3 files in the `tracks/` prefix of the R2 bucket
- Extracts the filenames and strips the `.mp3` extension
- Filters to only include IDs starting with `track_`
- Creates a sorted array of these IDs
- Validates the array before uploading
- Uploads to `tracks/list.json` using `uploadJsonToR2()`

### verify-list-json.ts

This script:
- Downloads the current `tracks/list.json` from R2
- Checks if it's a valid JSON array
- Verifies all entries are strings starting with `track_`
- Reports success/failure with detailed error information
- Exits with a non-zero code if validation fails (useful for CI)

### update-list-from-tracks.ts

This script:
- Acts as a wrapper around `repair-list-json.ts`
- First counts the number of valid track files
- Only proceeds if at least one valid track is found
- Outputs clear success/failure messages
- Is safe to run after every track upload

## Preventing Future Corruption

To prevent future corruption:

1. Never manually edit the `tracks/list.json` file
2. Always use the provided scripts to update the list
3. Run `npm run r2:verify-list` regularly to check for issues
4. After adding new tracks, always run `npm run r2:update-list`
5. Consider adding the verification script to your CI/CD pipeline

By following these steps, we can ensure the integrity of the track list and maintain a reliable experience for users. 