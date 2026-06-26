<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Personal Finance Tracker Agent Guide

## Project purpose

This repository is a personal finance web application intended to replace a fragile Excel workflow with a mobile-first, secure and maintainable tool for monthly income, spending, installments, recurring obligations, USD savings and yearly analysis.

## Required reading

Before changing product behavior, read:

- `docs/PRODUCT_SPEC.md`
- `docs/BUSINESS_RULES.md`
- `docs/DATA_MODEL_PROPOSAL.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/MIGRATION_STRATEGY.md`
- `docs/SOURCE_DATA_AUDIT.md`
- `docs/OPEN_DECISIONS.md`

## Non-negotiable financial rules

- Do not duplicate credit card consumption when the card statement is paid.
- Do not treat transfers between own accounts as expenses.
- Keep recurring expenses separate from installment purchases.
- Keep real movements separate from planned or pending-review movements.
- Do not store redundant monthly totals when they can be derived safely.
- Do not call the monthly estimated result a bank balance, Mercado Pago balance or exact cash-flow result.
- Keep USD savings/investment contributions separate from valuation changes.

## Private data protection

- `data/private/` contains sensitive financial information.
- Never modify, move, rename or copy files from `data/private/`.
- Never copy private data to `public/`.
- Never add private files to Git.
- Never use real private movements as public fixtures, examples or tests.
- Keep generated logs and docs at structural level; do not dump personal transaction lists.

## Work style

- Work in small, reviewable increments.
- Avoid changes outside the requested scope.
- Do not install dependencies without a clear justification.
- Do not configure external services unless explicitly requested.
- Do not create commits automatically.
- Report the exact files modified.

## Quality bar

- Keep TypeScript strict.
- Preserve accessibility and mobile-first design.
- Run lint, tests and build when they exist and are relevant to the change.
- Keep financial authorization checks on the server side, not only in client UI.
- Supabase/PostgreSQL, Supabase Auth and Row Level Security are the MVP provider/security baseline once implementation reaches persistence.
- Future Supabase tables with private data must have an owner field and Row Level Security.
- `Gastos 2026!E16` is explicitly excluded from financial data and must not be imported or saved as `pending_review`.

## Supabase persistence rules

- Every schema change must be represented by a reviewed migration in `supabase/migrations/`.
- RLS is mandatory on private tables, with explicit policies per operation.
- Never expose or use `service_role` keys in application code.
- Regenerate `lib/supabase/database.types.ts` after applying migrations.
- Do not hand-edit generated database types except to replace them with regenerated output.
- Do not import private financial data unless a later phase explicitly approves it.
