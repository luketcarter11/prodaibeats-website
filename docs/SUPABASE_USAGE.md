# Supabase Usage in ProdAI Beats

## Overview

In the current implementation of ProdAI Beats, Supabase is used **exclusively for user authentication**. This document clarifies the scope of Supabase integration and provides guidance for developers working on the project.

## Authentication Only

- Supabase is configured to handle user authentication processes
- User login, signup, and session management utilize Supabase Auth
- No other Supabase features (Database, Storage, Functions, etc.) are currently in use

## Data Storage

Despite initial plans to use Supabase for data storage:
- Track metadata is stored locally in `data/tracks.json`
- Source configuration and scheduler state are managed through local files
- Audio files are stored in the local filesystem

## Future Considerations

If expanding Supabase usage beyond authentication:
1. Update configuration in `.env` files
2. Follow migration steps in `docs/SUPABASE_SETUP.md`
3. Document any schema changes or new features

## Troubleshooting

If encountering Supabase connection issues:
- Ensure `.env` variables are correctly set for authentication
- Run diagnostic scripts in the `scripts/` directory
- See `docs/SUPABASE_PROJECT_ISSUES.md` for comprehensive troubleshooting

## Development Note

When working with track data or scheduler state, remember to use the appropriate local file paths rather than attempting to query Supabase. 