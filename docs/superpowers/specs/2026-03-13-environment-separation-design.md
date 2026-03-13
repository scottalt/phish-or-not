# Environment Separation Design

**Date:** 2026-03-13
**Status:** Approved
**Approach:** Vercel Environment Variables (Approach A)

## Goal

Separate dev/preview from production so that branch work never touches the prod database or cache. Preview deployments on Vercel should auto-connect to dev infrastructure.

## Infrastructure

### New Resources

| Resource | Plan | Purpose |
|----------|------|---------|
| Supabase project `phish-or-not-dev` | Free | Dev/preview database |
| Upstash Redis database `phish-or-not-dev` | Free | Dev rate limiting |

### Vercel Environment Variables

All variables scoped by Vercel environment (Production vs Preview & Development):

| Variable | Production | Preview & Development |
|----------|-----------|----------------------|
| `SUPABASE_URL` | prod URL | dev URL |
| `SUPABASE_PUBLISHABLE_KEY` | prod key | dev key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod key | dev key |
| `NEXT_PUBLIC_SUPABASE_URL` | prod URL | dev URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod key | dev key |
| `KV_REST_API_URL` | prod Upstash | dev Upstash |
| `KV_REST_API_TOKEN` | prod token | dev token |
| `OPENAI_API_KEY` | shared | shared |
| `ANTHROPIC_API_KEY` | shared | shared |
| `AI_PROVIDER` | shared | shared |
| `ADMIN_USER_ID` | shared | shared |

No code changes required — existing `lib/supabase.ts`, `lib/supabase-browser.ts`, and `lib/redis.ts` read from env vars cleanly.

### Local Development

Update `.env.local.example` to include the `NEXT_PUBLIC_` variables that `lib/supabase-browser.ts` requires. Developers running `npm run dev` locally should copy `.env.local.example` and fill in dev Supabase/Upstash credentials.

### Housekeeping

- Add `backups/` to `.gitignore` (avoid committing database dumps)
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.local.example`

## Supabase CLI & Migration Workflow

### Local Setup

- Install Supabase CLI as a dev dependency
- Link to both projects using project refs
- Add npm scripts for common operations

### Migration Flow

```
1. Create migration:  supabase migration new <name>
2. Write SQL in:      supabase/migrations/<timestamp>_<name>.sql
3. Test on dev:       npm run db:push:dev
4. PR & review:       Migration file reviewed alongside code
5. Apply to prod:     npm run db:dump:prod && npm run db:push:prod
6. Merge to master:   Vercel deploys code to prod
```

> **Ordering matters:** For additive migrations (new columns/tables the code depends on), run `db:push:prod` **before** merging so the schema is ready when the code deploys. For removal migrations (dropping unused columns), deploy the code first, then migrate later.

### NPM Scripts

```json
"db:push:dev": "supabase db push --project-ref <dev-ref>",
"db:push:prod": "supabase db push --project-ref <prod-ref>",
"db:dump:prod": "supabase db dump --project-ref <prod-ref> > backups/pre-migration-$(date +%Y%m%d-%H%M%S).sql",
"db:reset:dev": "supabase db reset --project-ref <dev-ref>",
"db:seed:dev": "psql <dev-connection-string> -f supabase/seed.sql"
```

### Initial Dev DB Setup

Apply all existing migrations from `supabase/migrations/` to the new dev project to match prod schema. Seed with a subset of freeplay cards exported from prod.

## Seed Data

Export a sample of freeplay cards from prod Supabase and commit as `supabase/seed.sql`. This gives dev a realistic dataset for testing without needing the full prod corpus.

## Prod Data Safety

### Migration Rules

These are mandatory for all migrations targeting prod:

1. **Pre-migration backup is mandatory.** Run `npm run db:dump:prod` before every `npm run db:push:prod`.

2. **No destructive SQL in a single migration:**
   - No `DROP TABLE` / `DROP COLUMN`
   - No `TRUNCATE` / `DELETE` without `WHERE`
   - No `ALTER COLUMN ... TYPE` (type changes)
   - No `CASCADE` on anything

3. **Two-phase removal process:**
   - Deploy 1: Stop using the column/table in code
   - Deploy 2 (days later): Drop it after confirming nothing references it

### Answers Table Protection

A Postgres trigger on the `answers` table blocks `DELETE` and `TRUNCATE`:

```sql
CREATE OR REPLACE FUNCTION prevent_answer_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Direct deletion from answers table is blocked. Use admin override if necessary.';
END;
$$ LANGUAGE plpgsql;

-- Row-level: blocks individual DELETEs
CREATE TRIGGER protect_answers_delete
  BEFORE DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION prevent_answer_deletion();

-- Statement-level: blocks TRUNCATE
CREATE TRIGGER protect_answers_truncate
  BEFORE TRUNCATE ON answers
  FOR EACH STATEMENT EXECUTE FUNCTION prevent_answer_deletion();
```

This trigger is applied to both prod and dev databases.

> **Note:** Postgres requires separate triggers for DELETE (row-level) and TRUNCATE (statement-level) — they cannot be combined.

### Safety Hierarchy

```
Trigger blocks deletes on answers  →  catches bad migrations
Pre-migration backup               →  catches schema mistakes
Supabase PITR (Pro plan)           →  catches everything else
```

## Deployment Workflow (End to End)

```
feature branch → PR opens
  ├── Vercel: preview deploy → dev Supabase + dev Upstash
  ├── (future) GitHub Actions: lint + typecheck + test + build
  └── Manual testing on preview URL
       ↓
  PR approved & merged to master
       ↓
  Vercel: production deploy → prod Supabase + prod Upstash
       ↓
  If migration included: db:dump:prod → db:push:prod (manual)
```
