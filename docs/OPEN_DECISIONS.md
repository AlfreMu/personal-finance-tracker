# Decisions

This document records decisions that were closed by user confirmation and the few decisions still open for later phases.

## Closed decisions

### Initial provider

Decision: Use Supabase/PostgreSQL for the MVP, with Supabase Auth and Row Level Security.

Implications:

- Keep schema portable PostgreSQL.
- Use versioned migrations.
- Provide complete data export.
- Avoid unnecessary dependency on proprietary Supabase features.
- Do not configure Supabase until the implementation phase.

### Movement model

Decision: Adopt a hybrid model.

Implications:

- Central `movements` table for common financial facts.
- Specialized entities for recurrences, installments and investments.
- Specialized entities reference `movement_id` explicitly when they create or confirm a financial fact.
- Do not use a universal unrestricted table.
- Do not use weak `source_kind/source_id` polymorphic references.
- Do not store a redundant `month` on normal movements; derive reporting month from `date`.
- Keep `period_month` for recurrence instances, installments, reconciliations and historical summaries.

### Monthly result wording

Decision: Use `Resultado estimado del mes` as the primary indicator.

Implications:

- Formula: `confirmed income - confirmed consumption - registered savings`.
- It is an economic monthly indicator.
- It is not a bank balance, Mercado Pago balance or exact cash-flow result.
- If the UI uses available wording, it must say `Disponible estimado segun movimientos registrados`.

### Mercado Pago MVP treatment

Decision: Simplified Mercado Pago reconciliation is informational in the MVP.

Implications:

- Show the difference as `consumo no detallado estimado`.
- Do not automatically add it to total spending.
- Do not persist estimated consumption as normal source data if it can be derived.
- It may be persisted only as a closure snapshot with inputs and formula version.
- A future flow may convert the difference into a `pending_review` movement after confirmation.

### USD opening balance

Decision: Store the 2026-06-25 USD opening balance as `investment_movements` with type `opening_balance`.

Implications:

- It does not affect income, expenses, monthly savings or return.
- Do not create a dedicated opening-balances table for USD funds in the MVP.
- Generic account snapshots may be considered in a later version.

### Historical years

Decision: Import 2026 at movement level and import 2023, 2024 and 2025 initially as monthly historical summaries.

Implications:

- Historical summaries remain separated from normalized movements.
- The app must not simulate detail that does not exist.
- Advanced historical statistics belong to version 1.1.

### ICBC statement payments

Decision: ICBC card statement payment is outside the first operational version.

Implications:

- Consumption is counted by purchase date.
- Later statement payments can be added as non-consumption cash-flow events.
- Statement payment must never duplicate expense totals.

### Installment edit/delete behavior

Decision: Installment history must not be silently rewritten.

Rules:

- A confirmed installment can only be edited individually.
- A future installment can be edited only for itself or for itself and following installments.
- Editing future installments does not alter confirmed installments.
- Deleting a purchase preserves confirmed installments and cancels only future installments.
- Any operation affecting multiple installments requires explicit confirmation.

### Import review workflow

Decision: Ambiguous import records are saved as `pending_review`.

Implications:

- Preserve source file, sheet and cell traceability.
- Show pending records in a review inbox.
- Exclude pending-review records from all calculations until resolved.

### Excluded Excel annotation

Decision: `Gastos 2026!E16` is excluded by explicit user confirmation.

Implications:

- It is not income, expense, savings, transfer or any financial movement.
- Do not import it.
- Do not save it as `pending_review`.
- Do not show it in the application.
- Do not include it in statistics, validations or migration warnings.

## Remaining open decisions

### Exact movement enum names

Question: What exact enum values should be used for movement `type`, `nature` and `status`?

Context: The conceptual model is stable, but final names affect migrations, code readability and UI labels.

Options:

- English enum values with Spanish UI labels.
- Spanish enum values matching UI labels.

Recommendation: Use English enum values in code/database and Spanish labels in UI.

Impact of postponing: Safe to postpone until schema implementation.

### Account snapshots for version 1.1

Question: Are generic account snapshots needed for operating-balance analysis?

Context: The MVP avoids exact cash-flow/balance claims, but version 1.1 may add flow-of-funds analysis.

Options:

- Add account snapshots in version 1.1.
- Keep only movement-based exports and reconciliations.

Recommendation: Postpone until after MVP usage shows whether balance analysis is useful.

Impact of postponing: No impact on MVP; it only limits exact operating-balance reporting.

### Mercado Pago detailed reconciliation policy

Question: How should individual Mercado Pago expenses coexist with `consumo no detallado estimado`?

Context: MVP estimate is informational only, but future reconciliation may combine manual expenses and monthly differences.

Options:

- Subtract individual MP expenses from the estimated difference.
- Treat estimate and individual expenses as separate review buckets.
- Convert only user-approved differences into `pending_review` movements.

Recommendation: Decide in version 1.1 after the basic movement workflow is stable.

Impact of postponing: MVP statistics remain correct because the estimate is not added automatically.
