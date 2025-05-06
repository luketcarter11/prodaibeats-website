# CDN URL Fix Guide

## The Problem

Our website was experiencing audio playback failures due to incorrect CDN URLs used in both:

1. **Metadata files** stored in the R2 bucket (`metadata/track_*.json`)
2. **Source code** throughout the codebase

The issue stemmed from a typo in the Cloudflare R2 public URL:

- **Incorrect URL:** `https://pub-c059baad842f47laaa2labb935e98d.r2.dev`
- **Correct URL:** `https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev`

The problem was in the middle portion of the URL where:
- `47laaa2labb` (incorrect) 
- `471aaaa2a1bbb` (correct)

## Solution Components

We've implemented a comprehensive solution with several components:

### 1. Enhanced Metadata URL Repair

The `repair-metadata-urls.ts` script has been enhanced to:

- Search for multiple incorrect domain variations
- Provide detailed logs of changes
- Validate fixed URLs before uploading
- Handle JSON parsing errors gracefully
- Support proper pagination for large metadata collections

### 2. Global CDN URL Fixer

We've created a new script called `fix-all-cdn-urls.ts` that:

- Scans the entire codebase for incorrect URL patterns
- Identifies all files containing incorrect domains
- Automatically fixes both code files and R2 metadata
- Provides detailed reports of changes made

### 3. Command-line Scripts

The solution is accessible through simple npm commands:

- `npm run r2:repair-metadata` - Fix only R2 metadata URLs
- `npm run r2:fix-cdn-urls` - Comprehensive fix for both code and metadata

## How to Use the Fix Tools

### Step 1: Verify Environment Variables

Make sure your `.env` file contains the correct CDN URL:

```
NEXT_PUBLIC_STORAGE_BASE_URL=https://pub-c059baad842f471aaaa2a1bbb935e98d.r2.dev
```

### Step 2: Run the Fix Tools

To run the comprehensive fix for both code and metadata:

```bash
npm run r2:fix-cdn-urls
```

To fix only metadata in R2 storage:

```bash
npm run r2:repair-metadata
```

### Step 3: Verify the Changes

After running the fix tools:

1. Restart your development server: `npm run dev`
2. Test audio playback on several tracks
3. Check the browser console for any remaining URL-related errors

## How the URL Fixer Works

### Codebase Scanning

The tool uses grep to search through all `.js`, `.ts`, `.jsx`, and `.tsx` files for any instances of the incorrect domains, excluding node_modules and other irrelevant directories.

### Smart Replacement

For each file containing incorrect domains, the tool:

1. Reads the file content
2. Replaces all instances of incorrect domains with the correct one
3. Only writes back to the file if changes were made
4. Reports exactly what was changed

### R2 Metadata Repair

For the R2 metadata files, the tool:

1. Lists all JSON files in the metadata/ prefix
2. Downloads each file and checks for incorrect URLs
3. Fixes both audioUrl and coverUrl properties
4. Validates the corrected URLs
5. Uploads the fixed metadata back to R2

## Prevention Measures

To prevent similar issues in the future:

1. **Environment Variable Validation** - The tools now validate the format of the CDN URL
2. **Centralized Configuration** - Using the r2Config.ts module as the single source of truth
3. **Automated Verification** - Regular checks for URL integrity

## Troubleshooting

If you encounter issues:

- Check that your R2 credentials are properly configured
- Verify that the NEXT_PUBLIC_STORAGE_BASE_URL environment variable is correctly set
- Run `npm run r2:check` to verify your R2 configuration 