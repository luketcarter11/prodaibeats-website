# Tracks List Integrity Protection System

This document describes the comprehensive system implemented to protect the integrity of the `tracks/list.json` file in R2 storage, which is critical for the proper functioning of the audio player.

## The Problem

The `tracks/list.json` file in our R2 bucket has been experiencing persistent corruption. This file is supposed to store a flat array of track IDs in the format:

```json
["track_abc123", "track_def456", ...]
```

However, the file repeatedly becomes corrupted with:
- Invalid JSON syntax
- Random individual characters instead of track IDs
- Non-track entries (like "local_" IDs or testing entries)
- Duplicate entries

This breaks the site's audio player because the frontend relies on this list to fetch and display tracks.

## Solution Overview

We've implemented a comprehensive protection system with multiple layers:

1. **Enhanced Upload Function** - Strict validation in the R2 uploader to prevent corruption at the source
2. **Verification Tools** - CLI tools to check and repair the tracks list
3. **Automated Checks** - Git hooks and GitHub Actions to verify integrity on every commit/push
4. **Backup System** - Automatic backups before any changes to tracks/list.json

## 1. Enhanced Upload Function

The `uploadJsonToR2` function in `src/lib/r2Uploader.ts` has been enhanced with:

- **Strict validation** for tracks/list.json
- **JSON format verification** before upload
- **Automatic backups** before replacing the file
- **Post-upload verification** to ensure successful upload

This prevents corruption at the source by rejecting invalid data before it reaches R2.

## 2. Verification Tools

### Verify Only: `npm run r2:verify-tracks`

This command checks:
- If tracks/list.json exists and is valid JSON
- If it contains only valid track IDs (starting with "track_")
- If it contains duplicates
- If it matches the actual MP3 files in the R2 bucket

Example:
```bash
npm run r2:verify-tracks
```

### Verify and Fix: `npm run r2:fix-tracks`

This command performs the same checks but automatically fixes any issues:
- Rebuilds the list from actual MP3 files
- Removes invalid entries
- Deduplicates the list
- Creates a backup before making changes

Example:
```bash
npm run r2:fix-tracks
```

For verbose output, add `--verbose`:
```bash
npm run r2:verify-tracks -- --verbose
```

### Original Repair Tool

The original repair tool is still available:
```bash
npm run r2:repair-list
```

## 3. Automated Integrity Checks

### Git Pre-Commit Hook

A Git pre-commit hook runs automatically before each commit to verify the tracks/list.json integrity:

```bash
# .husky/pre-commit
npx tsx verify-tracks-integrity.ts
```

If verification fails, the commit is blocked, and you'll be prompted to run the fix command.

### GitHub Actions Workflow

A GitHub Actions workflow verifies the tracks/list.json integrity on:
- Every push to the main branch
- Every pull request
- Manual trigger

This ensures that we catch issues immediately, even if they bypassed local checks.

## 4. Backup System

Before any change to tracks/list.json, a backup is automatically created in the R2 bucket:

```
backups/tracks-list-[timestamp].json
```

This allows recovery from corruption even if all other safeguards fail.

## How to Use

### Regular Maintenance

1. **Verify current state**:
   ```bash
   npm run r2:verify-tracks
   ```

2. **Fix issues (if any)**:
   ```bash
   npm run r2:fix-tracks
   ```

### After Uploading New Tracks

When new tracks are uploaded, run:
```bash
npm run r2:update-list
```

This will scan all tracks in the R2 bucket and update tracks/list.json accordingly.

### Recovering from Corruption

If the tracks list is corrupted:

1. **Fix automatically**:
   ```bash
   npm run r2:fix-tracks
   ```

2. **If automatic fix fails**, restore from a backup:
   - List backups in R2 (use Cloudflare dashboard)
   - Download the most recent backup
   - Verify its contents
   - Upload it back as tracks/list.json

## Implementation Details

### Validation Process

The validation enforces the following rules:
- tracks/list.json must be a JSON array
- All elements must be strings
- All elements must start with "track_"
- No duplicate elements allowed

### Repair Process

The repair tool:
1. Lists all MP3 files in the tracks/ folder in R2
2. Extracts valid track IDs from the filenames
3. Filters out any invalid entries
4. Deduplicates the list
5. Creates a backup of the current list
6. Uploads the fixed list

### Integration with Track Upload

When new tracks are uploaded, the system:
1. Validates the track data
2. Uploads the track files
3. Updates the tracks/list.json to include the new track

## Best Practices

1. **Always use provided tools** - Don't manually edit tracks/list.json
2. **Run verification regularly** - Especially after deploying changes
3. **Check logs after uploads** - Verify successful updates
4. **Include verification in CI/CD** - Catch issues early

By following these practices and using the provided tools, we can ensure the integrity of the tracks/list.json file and prevent future corruption. 