# AI Weekly Assistant — Architecture Baseline

## Runtime shape

- Next.js + TypeScript web application.
- Modular monolith for HTTP/API and domain logic.
- PostgreSQL as the authoritative product database.
- Prisma schema and migrations for database access.
- Redis + BullMQ worker will own delayed notification jobs.
- AI providers are accessed behind a server-side adapter.

Source lokal Fase 1 memakai PostgreSQL untuk akun, sesi, token reset, pembatasan login, serta preferensi. Versi website online tetap menjadi demo UI sampai database managed dan adapter email dipilih.

## Identity invariants

- Kata sandi di-hash dengan bcrypt cost 12 dan tidak pernah disimpan mentah.
- Token sesi dan reset dibuat secara acak; hanya HMAC SHA-256 yang disimpan.
- Cookie sesi memakai `HttpOnly`, `SameSite=Lax`, dan `Secure` di production.
- Reset token hanya sekali pakai, kedaluwarsa dalam 30 menit, dan merotasi seluruh sesi pengguna.
- Percobaan login dan reset yang berlebihan dibatasi dengan record PostgreSQL.
- Semua query produk berikutnya wajib memakai `userId` dari sesi server, bukan input klien.

## Module boundaries

- `identity`: users, sessions, ownership checks.
- `preferences`: timezone, active days, sleep, focus and reminder defaults.
- `tasks`: task lifecycle and validation.
- `routines`: recurrence definitions and occurrences.
- `scheduling`: deterministic slot calculation and constraint checking.
- `ai-extraction`: Brain Dump provider adapter, schema validation and review state.
- `notifications`: subscription management and idempotent reminder jobs.
- `audit`: security and material change events.

## Time invariants

- Persist instants as PostgreSQL `timestamptz` in UTC.
- Persist the user’s IANA timezone separately.
- Treat local routines as wall-clock rules and materialize dated occurrences.
- Use half-open ranges `[startsAt, endsAt)` so adjacent blocks do not overlap.
- Revalidate conflicts in the service layer and PostgreSQL transaction.

## Database invariant

PostgreSQL must enforce non-overlap for `PLANNED` and `ACTIVE` schedule blocks per user with a GiST exclusion constraint after the Prisma base migration is generated.

## Deployment stages

1. UI and interaction baseline.
2. Managed PostgreSQL connection and migrations.
3. Identity and user-owned manual task flow.
4. Scheduling engine integration.
5. AI extraction adapter.
6. Redis worker, Web Push and PWA hardening.
