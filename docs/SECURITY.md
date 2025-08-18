# Security Guidelines

## Environment Variables

### Client-Safe Keys (can be in distributed app)
- `SUPABASE_URL` - Public URL, safe to expose
- `SUPABASE_ANON_KEY` - Public anonymous key, protected by Row Level Security (RLS)
- `IOS_GOOGLE_CLIENT_ID` - OAuth client ID, designed to be public

### Server-Only Keys (NEVER in client apps)
- `SUPABASE_SERVICE_ROLE_KEY` - **CRITICAL: Never expose this!**
  - Has full database access
  - Bypasses all RLS policies
  - Only use in:
    - Backend servers
    - Build scripts
    - Database migration scripts
    - Admin tools

## Breed Data Strategy

Instead of fetching breeds from the database at runtime (which would require network calls), we:

1. **Build Time**: Generate static `breeds.json` using the service role key
2. **Bundle**: Include `breeds.json` in the app bundle
3. **Runtime**: Load breeds from the bundled JSON file

This approach:
- ✅ No network calls needed for breed search
- ✅ Instant, offline-capable search
- ✅ No API keys exposed
- ✅ Smaller app size (breeds.json is ~50KB)

## Build Process

```bash
# 1. During development/CI build
node scripts/generate-breeds-data.js  # Uses service role key

# 2. The generated src/assets/data/breeds.json is bundled with the app

# 3. App uses the bundled data, no API calls needed
```

## Gitignore Rules

Always ensure these are in `.gitignore`:
```
.env
.env.local
.env.production
*.key
*.pem
```

Never gitignore:
```
.env.example  # This shows what keys are needed without values
```

## Checking for Exposed Keys

Before committing:
```bash
# Search for potential exposed keys
grep -r "SUPABASE_SERVICE_ROLE_KEY" . --exclude-dir=node_modules
grep -r "eyJ" . --exclude-dir=node_modules  # JWT tokens start with eyJ
```

## If a Service Role Key is Exposed

1. **Immediately** regenerate it in Supabase Dashboard
2. Update your `.env` file
3. Audit database logs for unauthorized access
4. Consider the repository compromised if it was pushed to public repo