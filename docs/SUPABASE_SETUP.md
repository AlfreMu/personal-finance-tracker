# Supabase Setup

## Project

- Name: `personal-finance-tracker-dev`
- Project ref: `xutsklpnitwjdawvwdxo`
- Organization: `AlfreMu`
- Region: `sa-east-1`
- Plan: free

Do not use this project for other applications.

## Environment Variables

Required local variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use only publishable keys in the application. Do not add `service_role` keys to client, server component, server action or route handler code.

## Migrations

Schema source of truth is `supabase/migrations/`.

Current migrations:

- `20260625170000_initial_private_finance_foundation.sql`: initial private finance schema, RLS, profile trigger and bootstrap.
- `20260626152000_harden_rls_and_indexes.sql`: RLS policy performance hardening, bootstrap RPC hardening and composite foreign-key indexes.

Apply migrations with the Supabase MCP or CLI after reviewing the SQL file. Do not make schema-only remote changes without adding a migration.

## Type Generation

Generated TypeScript types live in:

```text
lib/supabase/database.types.ts
```

Regenerate after applying migrations. Prefer the Supabase MCP `generate_typescript_types` tool or the official CLI:

```bash
supabase gen types typescript --project-id xutsklpnitwjdawvwdxo --schema public > lib/supabase/database.types.ts
```

The CLI requires `supabase login` or `SUPABASE_ACCESS_TOKEN`.

## Auth

The app uses Supabase Auth email/password through `@supabase/ssr`.

- `/login` and `/registro` are public.
- `/`, `/movimientos`, `/estadisticas`, `/ahorros` and `/configuracion` are protected by `proxy.ts`.
- Login and registration use server actions.
- Logout calls Supabase Auth sign-out and redirects to `/login`.

If email confirmation is enabled, registration can return without a session. The UI shows a message asking the user to check email before login. Do not disable email confirmation unless that is an explicit product/security decision.

## Bootstrap

New Auth users trigger `public.handle_new_user()`, which creates:

- one `profiles` row;
- initial accounts;
- payment methods;
- ICBC card metadata without closing/due days;
- editable categories;
- income sources;
- USD investment funds.

The authenticated RPC `public.bootstrap_current_user_defaults()` repeats the same setup idempotently for the current user only. Idempotency is enforced with unique constraints and `on conflict` clauses.

No balances, real movements, private Excel values or USD holdings are loaded in this phase.

## RLS Verification

All private tables have RLS enabled and explicit `select`, `insert`, `update` and `delete` policies.

General rule:

```sql
(select auth.uid()) = user_id
```

For `profiles`:

```sql
(select auth.uid()) = id
```

To verify RLS, test that one authenticated user:

- sees only their own rows;
- cannot insert rows with another `user_id`;
- cannot update another user's rows;
- cannot delete another user's rows.

## Running Locally

Install dependencies and run:

```bash
npm run dev
```

Production check:

```bash
npm run lint
npm run build
```

The financial UI still uses `lib/prototype-store.tsx` and `lib/mock-data.ts`. Persistence is intentionally not connected to movements, dashboard, installments, savings or statistics yet.
