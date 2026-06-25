# Implementation Plan

Each phase should be small, reviewable and end with a working build when product code is touched. Supabase/PostgreSQL is the selected MVP provider, but no external provider should be configured until the relevant implementation phase.

## Phase 1 - Documentation and decisions

Objective: Establish product, rules, data model, migration strategy and open decisions.

Scope: Files in `docs/` and `AGENTS.md`.

Out of scope: Product code, database, providers, imports.

Areas affected: Documentation only.

Dependencies: Excel and screenshots read-only.

Acceptance: All requested docs exist and are internally consistent.

Tests: Documentation review; no build required unless docs tooling is added.

Risks: Ambiguities hidden instead of documented.

Advance when: closed decisions are reflected in the docs and remaining decisions do not block MVP design.

## Phase 2 - Visual design with mock data

Objective: Build navigable UI shell with realistic mock data and mobile-first layout.

Scope: Dashboard, bottom nav, add action, movements/statistics/savings/settings placeholders.

Out of scope: Persistence, auth, import.

Areas affected: `app/`, future `components/`, styles.

Dependencies: Product spec and UI flows.

Acceptance: User can inspect main screens with mock data on mobile and desktop.

Tests: Lint, build, visual browser check.

Risks: Mock data accidentally based on private records.

Advance when: Layout supports the core workflows without spreadsheet grids.

## Phase 3 - Final data model

Objective: Convert conceptual model into final schema plan.

Scope: Hybrid movement model, table definitions, constraints, indexes, RLS draft and migration files if approved.

Out of scope: UI features.

Areas affected: database schema area to be chosen.

Dependencies: Closed decisions for Supabase/PostgreSQL, Supabase Auth, RLS and hybrid movement model.

Acceptance: Schema supports business rules without redundant totals.

Tests: Schema validation and fixture-free unit tests where possible.

Risks: Overgeneric movement model, redundant reporting month on movements or missing ownership constraints.

Advance when: Security and rollback strategy are reviewed.

## Phase 4 - Authentication and security

Objective: Add sign-in and private data boundaries.

Scope: Supabase Auth, profile creation, protected routes, server-side authorization helpers.

Out of scope: Full finance features.

Areas affected: auth utilities, protected app layout, environment docs.

Dependencies: Supabase project setup during this phase only.

Acceptance: Unauthenticated users cannot access private screens; server mutations verify user.

Tests: Lint, build, auth flow tests if tooling exists.

Risks: Relying only on client navigation or proxy.

Advance when: RLS and server authorization are both in place.

## Phase 5 - Income

Objective: Register confirmed income manually.

Scope: Income form, sources, income types, income list and dashboard total.

Out of scope: Auto salary generation.

Areas affected: income UI, actions, model access, dashboard query.

Dependencies: Auth and schema.

Acceptance: Salary, honorarios and other income can be recorded and edited.

Tests: Validation tests, server action authorization, dashboard total.

Risks: Suggestion becoming implicit auto-create.

Advance when: income affects monthly estimated result correctly.

## Phase 6 - Variable ICBC card expenses

Objective: Fast default path for everyday card expenses.

Scope: Add movement form defaults, expense creation, category selection, dashboard variable total.

Out of scope: ICBC card statement payment and reconciliation, which belong to version 1.1.

Areas affected: movement form, actions, dashboard.

Dependencies: Categories, payment methods, auth.

Acceptance: Routine card expense can be saved quickly and counted by purchase month.

Tests: Form validation, duplicate-submit prevention, purchase-date month derivation.

Risks: Counting by payment month instead of purchase month.

Advance when: Main daily workflow is reliable.

## Phase 7 - Recurring expenses

Objective: Track fixed recurring obligations and monthly confirmation.

Scope: Recurring rules, generated monthly instances, confirm/edit flow.

Out of scope: Installments.

Areas affected: recurring module, movements, dashboard fixed block.

Dependencies: Movement status model.

Acceptance: Amount changes do not rewrite past confirmed months.

Tests: Instance idempotency, amount snapshot, dashboard totals.

Risks: Duplicate monthly instances.

Advance when: Planned versus confirmed behavior is clear.

## Phase 8 - Installment purchases

Objective: Track temporary commitments and future balances.

Scope: Purchase form, schedule generation, monthly installment list, edit/delete rules.

Out of scope: Full card statement reconciliation.

Areas affected: installment module, movements, dashboard installment block.

Dependencies: Explicit `movement_id` tracing from installments to confirmed movements.

Acceptance: App shows `cuota N de M`, end month and future committed balance. Confirmed installments edit individually; future installments can update one or one-and-following; deleting a purchase preserves confirmed installments and cancels future installments.

Tests: Schedule generation, rounding, edit/delete behavior.

Risks: Treating installments as recurring fixed expenses.

Advance when: Future commitments are trustworthy.

## Phase 9 - USD savings

Objective: Track USD opening balance and future savings movements.

Scope: Funds, opening snapshot, contributions, withdrawals, transfers, valuation adjustments.

Out of scope: Live quotes.

Areas affected: savings section, investment model, statistics.

Dependencies: Decision to store USD opening balances as `investment_movements` with type `opening_balance`.

Acceptance: Opening snapshot does not affect June income, expense or savings.

Tests: Contribution versus valuation calculations.

Risks: Mixing return with user contribution.

Advance when: Patrimony reporting is separated from consumption.

## Phase 10 - Movements and filters

Objective: Provide a unified searchable movement ledger.

Scope: Filters, detail, edit, delete, notes, category/date changes.

Out of scope: Bulk edit.

Areas affected: movements page, detail modal/page, actions.

Dependencies: Income, expenses, recurring, installments.

Acceptance: User can audit and correct monthly data without losing traceability.

Tests: Filter combinations, authorization, source-specific edit rules.

Risks: Deletes breaking installment or recurrence links.

Advance when: Corrections are predictable.

## Phase 11 - Basic monthly statistics

Objective: Basic monthly analytics needed to validate the dashboard from derived data.

Scope: Monthly breakdown, category distribution, largest expenses and previous-month comparisons.

Out of scope: Advanced historical analytics, full yearly exploration and cash-flow analysis.

Areas affected: statistics pages and query layer.

Dependencies: Stable movement model.

Acceptance: Totals match derived movement sums, use monthly estimated result wording and exclude pending-review records.

Tests: Calculation unit tests with synthetic data.

Risks: Reintroducing redundant monthly totals.

Advance when: Dashboard and statistics agree.

## Phase 12 - 2026 import

Objective: Import 2026 Excel data safely at movement level.

Scope: Extract, normalize, intermediate JSON/CSV, dry run, validation, idempotent import, report, review inbox for ambiguous records.

Out of scope: Auto import of bank data.

Areas affected: import scripts, admin/import UI or CLI, docs.

Dependencies: Final schema and category mapping.

Acceptance: Dry run reports rows, warnings and monthly checks without writing; real run is repeatable; `Gastos 2026!E16` is excluded silently as non-financial; ambiguous records are stored as `pending_review` with file/sheet/cell traceability.

Tests: Parser tests against sanitized fixtures, idempotency checks.

Risks: Private data leakage and ambiguous rows.

Advance when: User approves dry-run report.

## Phase 13 - CSV or JSON export

Objective: Give the user full data ownership.

Scope: Export normalized data and import audit metadata as CSV or JSON.

Out of scope: Restorable backups from the interface, which belong to version 1.1.

Areas affected: settings/export, server route or action.

Dependencies: Stable schema.

Acceptance: User can download all personal data in portable format.

Tests: Export schema validation.

Risks: Export accidentally omits linked entities.

Advance when: export format and restore limitations are documented.

## Phase 14 - Final audit

Objective: Check security, calculations, accessibility and privacy.

Scope: RLS review, calculation review, UI accessibility, private data audit.

Out of scope: New features.

Areas affected: All touched areas.

Dependencies: MVP operativo feature complete.

Acceptance: No known duplicate-counting paths, no private fixtures, no unauthenticated access, no `Gastos 2026!E16` import path.

Tests: Lint, build, targeted tests, manual browser verification.

Risks: Last-minute refactors causing regressions.

Advance when: Release checklist passes.

## Phase 15 - Deployment

Objective: Deploy the MVP safely.

Scope: Vercel project, environment variables, Supabase project, production build.

Out of scope: External financial integrations.

Areas affected: deployment configuration and environment setup.

Dependencies: Security audit and provider decisions.

Acceptance: Production app works with private auth and no secrets exposed.

Tests: Production build, smoke test, auth test, export test.

Risks: Misconfigured env vars or RLS.

Advance when: User validates production smoke test.

## Version 1.1 backlog

Objective: Extend the MVP after the operational loop is stable.

Scope: Advanced historical statistics, complete Mercado Pago reconciliation, ICBC statement payment and reconciliation, restorable backups from the interface, advanced visual configuration and cash-flow/operating-balance analysis.

Out of scope: Automatic bank integrations unless a separate decision approves them.

Dependencies: Stable MVP data model, export path and user validation.

Acceptance: New features do not change historical consumption totals or confuse monthly estimated result with exact account balances.
