# BugDaily (Starter)

A tiny Next.js app that shows **daily public critical bug-bounty write-ups** with Arabic/English toggle and live auto-refresh.

## How it works
- Frontend: Next.js (App Router) served on Vercel
- API: `/api/reports` reads from Postgres (Supabase/Neon) via `DATABASE_URL`
- Ingestor: GitHub Actions runs hourly and inserts new rows into `reports`

## Database schema (run once)
```sql
create extension if not exists pgcrypto;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  source_id text not null,
  title text not null,
  platform text not null,
  severity text not null,
  program text,
  bounty numeric,
  currency text,
  published_at timestamptz not null,
  url text not null,
  weakness text,
  hash text not null unique,
  created_at timestamptz default now()
);

create index if not exists idx_reports_published_at on reports(published_at desc);
create index if not exists idx_reports_sev_platform on reports(severity, platform);
```
