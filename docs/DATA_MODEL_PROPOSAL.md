# Data Model Proposal

This is a conceptual model, not executable SQL. It favors explicit financial entities over one generic table that hides business rules.

## Technical recommendation

The MVP will use Supabase/PostgreSQL, Supabase Auth and Row Level Security. This is now a closed decision for the initial provider because it provides managed Postgres, authentication and RLS at low operational cost while matching the expected Next.js deployment path.

The schema must remain portable PostgreSQL, migrations must be versioned, and exports must cover the complete private data set. Avoid unnecessary dependence on proprietary Supabase features for core calculations or data ownership.

Risks:

- Free plan projects may pause after inactivity, which can affect availability.
- Vendor-specific Auth and storage APIs create some lock-in.
- RLS policies must be tested carefully because financial data is private.

Mitigations:

- Keep financial data in portable Postgres tables.
- Avoid relying on provider-only features for core calculations.
- Maintain export and backup from the first MVP.
- Use lazy server-side clients in Next.js modules to keep builds safe.

Reasonable alternatives:

- Local SQLite plus encrypted backup for a purely personal offline-first tool, lower hosting cost but weaker multi-device sync.
- Neon or another managed Postgres plus an auth library, more portable but more integration work.
- Self-hosted Postgres, more control but higher maintenance.

## Ownership and security invariant

All private tables must include `user_id` or belong to an entity that includes `user_id`. RLS must ensure users can only read/write their own rows. Server Actions and Route Handlers must also verify authorization.

## Movement model decision

The product adopts a hybrid model:

- A central `movements` table stores common financial facts.
- Specialized entities model recurrences, installments and investments.
- Specialized entities reference `movement_id` where a confirmed financial fact exists.
- Avoid a universal unrestricted table and avoid weak polymorphic references such as `source_kind/source_id`.
- Totals remain derived from normalized rows.
- Normal movements do not store a redundant `month`; reporting month is derived from `date`.
- `period_month` is kept only for recurrence instances, installments, reconciliations and historical summaries.

## Entities

### users / profiles

Purpose: Own all private financial data and store app-level preferences not covered by auth provider metadata.

Fields: `id`, `auth_user_id`, `display_name`, `base_currency`, `locale`, `created_at`.

Relations: Owns accounts, categories, movements, imports, funds.

Restrictions: One auth user maps to one profile in the MVP.

Invariants: No private row exists without an owner.

Derived data: None.

Risks: Assuming single-user too deeply can make later migration painful.

### accounts

Purpose: Represent places where money or patrimony exists.

Fields: `id`, `user_id`, `name`, `type`, `currency`, `is_active`, `notes`.

Relations: Used by movements, transfers, investment accounts and reconciliations.

Restrictions: Type examples: ICBC pesos, Mercado Pago, cash, ICBC USD, USD investment funds.

Invariants: Account currency should match movement currency unless exchange details exist.

Derived data: Account balances are not MVP bank balances unless reconciled.

Risks: Overpromising real balances without integrations.

### payment_methods

Purpose: Explain how a consumption was made without implying account movement.

Fields: `id`, `user_id`, `name`, `kind`, `default_account_id`, `is_default`, `is_active`.

Relations: Referenced by expenses and installments.

Restrictions: Initial values: Tarjeta ICBC, Mercado Pago, Debito o transferencia, Efectivo.

Invariants: A payment method can exist without direct cash-flow posting.

Derived data: Spending by payment method.

Risks: Confusing payment method with account balance.

### cards

Purpose: Model credit cards separately from generic payment methods when statement periods and payments become relevant.

Fields: `id`, `user_id`, `payment_method_id`, `issuer`, `name`, `currency`, `closing_day`, `due_day`, `is_active`.

Relations: Used by card purchases now and possible statement payment records in version 1.1.

Restrictions: Initial card is ICBC credit card.

Invariants: Card purchases count by purchase date, not payment date.

Derived data: Statement balance can be derived later from card purchases and payments.

Risks: Premature statement automation. Keep MVP simple.

### categories

Purpose: Classify income, expenses and savings movements for reporting.

Fields: `id`, `user_id`, `name`, `kind_scope`, `color`, `sort_order`, `is_active`.

Relations: Referenced by movements, recurring rules and installment purchases.

Restrictions: Editable but shallow for MVP.

Invariants: Historical movements keep their category reference or a snapshot label if category is archived.

Derived data: Category totals by month/year.

Risks: Too many categories reduce usability.

### income_sources

Purpose: Normalize where income comes from.

Fields: `id`, `user_id`, `name`, `default_income_type`, `is_active`.

Relations: Referenced by income movements.

Restrictions: Supports salary, honorarios, aguinaldo, sale, reimbursement and other income.

Invariants: Sources do not auto-create income.

Derived data: Income by source.

Risks: Confusing source with income type.

### movements

Purpose: Store real, planned and pending financial events that are not better represented only as templates.

Fields: `id`, `user_id`, `date`, `type`, `nature`, `status`, `amount`, `currency`, `description`, `category_id`, `payment_method_id`, `account_id`, `counterparty_account_id`, `income_source_id`, `note`, `import_id`, `external_hash`, `created_at`, `updated_at`.

Relations: Referenced explicitly by `recurring_instances.confirmed_movement_id`, `installments.confirmed_movement_id` and contribution-like `investment_movements.movement_id` when a specialized entity creates a confirmed financial fact. Imports can reference movements through `import_id`.

Restrictions: Status values: planned, confirmed, pending_review, canceled.

Invariants:

- Pending-review movements do not affect totals.
- Transfers have origin and destination accounts.
- Card statement payments are not in the first operational version. Later they can be non-consumption cash-flow movements.
- Reporting month is derived from `date`.

Derived data: Monthly totals, percentages and monthly estimated result.

Risks: The central table can become too broad. Keep typed validations, explicit foreign keys from specialized entities and service functions strict.

### recurring_rules

Purpose: Define long-lived recurring obligations.

Fields: `id`, `user_id`, `description`, `category_id`, `payment_method_id`, `current_amount`, `currency`, `frequency`, `start_month`, `end_month`, `active`, `notes`.

Relations: Generates monthly recurring instances.

Restrictions: Amount changes should create new effective values or snapshot generated instances.

Invariants: Rule edits do not rewrite confirmed historical movements.

Derived data: Expected fixed expenses.

Risks: Generating too far into the future can create cleanup work.

### recurring_instances

Purpose: Represent a monthly planned or confirmed occurrence of a recurring rule.

Fields: `id`, `user_id`, `recurring_rule_id`, `period_month`, `planned_amount`, `confirmed_movement_id`, `status`, `generated_at`.

Relations: Links a rule to a movement through `confirmed_movement_id` when confirmed.

Restrictions: Unique rule plus month.

Invariants: A confirmed instance points to exactly one confirmed movement.

Derived data: Fixed total for month.

Risks: Duplicate instances if generation is not idempotent.

### installment_purchases

Purpose: Store the original purchase agreement for a temporary commitment.

Fields: `id`, `user_id`, `description`, `category_id`, `payment_method_id`, `purchase_date`, `start_month`, `total_amount`, `installment_amount`, `installment_count`, `first_installment_number`, `currency`, `status`, `notes`.

Relations: Owns installments.

Restrictions: Must not be modeled as a permanent recurring fixed expense.

Invariants: Installment schedule remains traceable to source purchase.

Derived data: End month and future committed balance.

Risks: Rounding differences between total and installment amounts.

### installments

Purpose: Monthly obligations generated from an installment purchase.

Fields: `id`, `user_id`, `installment_purchase_id`, `period_month`, `number`, `amount`, `status`, `confirmed_movement_id`.

Relations: Links to movements through `confirmed_movement_id` when confirmed.

Restrictions: Unique purchase plus installment number.

Invariants:

- Label can be derived as `description - cuota N de total`.
- Confirmed installments can only be edited individually.
- Future installments can be edited individually or from one installment onward.
- Editing future installments never alters confirmed installments.
- Deleting an installment purchase preserves confirmed installments and cancels only future installments.
- Multi-installment operations require explicit confirmation.

Derived data: Installment total by month and future committed balance.

Risks: Editing one installment versus remaining installments needs explicit UX.

### investment_funds

Purpose: Represent USD fund destinations.

Fields: `id`, `user_id`, `name`, `currency`, `provider`, `is_active`.

Relations: Referenced by investment movements.

Restrictions: Initial funds come from the known 2026-06-25 snapshot.

Invariants: Fund balance changes can come from contributions, withdrawals, transfers or valuation adjustments.

Derived data: Current fund value, contributed capital and return.

Risks: No live pricing in MVP; values are user-entered.

### investment_movements

Purpose: Track USD savings and investment activity.

Fields: `id`, `user_id`, `date`, `type`, `fund_id`, `from_fund_id`, `to_fund_id`, `movement_id`, `usd_amount`, `ars_amount`, `exchange_rate`, `note`, `status`.

Relations: May reference `movements.id` through `movement_id` when it represents a contribution, withdrawal or cash-flow fact. Opening balances and valuation adjustments do not need a linked movement unless the final schema requires one for auditing.

Restrictions: Types: opening_balance, usd_purchase, fund_contribution, withdrawal, fund_transfer, valuation_adjustment.

Invariants:

- The 2026-06-25 USD fund snapshot is stored as investment movements with type `opening_balance`.
- Opening balances do not affect income, expenses, monthly savings or return.
- Valuation adjustments do not increase contributed capital.

Derived data: Patrimony, contributions, returns and withdrawals.

Risks: Mixing ARS cash flow and USD patrimony in one record can confuse reports; final schema may split contribution and valuation entries.

### account_snapshots (future option)

Purpose: A possible future model for generic account snapshots or opening balances outside USD funds.

Fields: Not defined for MVP.

Relations: Could apply to accounts if operating-balance or cash-flow analysis becomes part of version 1.1 or later.

Restrictions: Do not create a dedicated opening-balances table for USD funds in the MVP; use `investment_movements` with type `opening_balance`.

Invariants: Snapshots must not become income, expense or savings contributions.

Derived data: Future operating-balance or patrimony baselines.

Risks: Premature balance modeling can imply exact bank balances the app does not yet have.

### monthly_reconciliations

Purpose: Store optional monthly reconciliation inputs and closure snapshots such as simplified Mercado Pago estimation.

Fields: `id`, `user_id`, `account_id`, `period_month`, `opening_balance`, `incoming_transfers`, `other_income`, `non_consumption_outflows`, `closing_balance`, `formula_version`, `closed_estimated_consumption_snapshot`, `status`.

Relations: Account and optional import.

Restrictions: Estimated consumption is derived from inputs and shown as `consumo no detallado estimado`. Store it only as a closure snapshot with formula version, not as the normal source of truth.

Invariants: Formula must be auditable.

Derived data: Mercado Pago `consumo no detallado estimado`.

Risks: Estimated consumption can double count if individual MP expenses are later combined without a reconciliation policy. In the MVP it remains informational and is not automatically added to total spending.

### imports

Purpose: Audit and control imports from Excel or intermediate files.

Fields: `id`, `user_id`, `source_file_name`, `source_period`, `source_hash`, `status`, `dry_run`, `created_at`, `created_by`, `summary_json`.

Relations: Imported movements reference import id.

Restrictions: Import should be idempotent and reversible by batch.

Invariants:

- Same source hash plus row fingerprint should not create duplicates.
- Ambiguous imported records are stored as `pending_review` movements with source file, sheet and cell traceability.
- `Gastos 2026!E16` is excluded by explicit user confirmation and must not be imported or warned about.

Derived data: Import reports.

Risks: Storing too much raw private data in logs. Keep reports summarized.

## Derived calculations

- Total income: sum confirmed income movements for period.
- Fixed expenses: sum confirmed recurring-derived expense movements.
- Installments: sum confirmed installment-derived expense movements.
- Variable expenses: sum confirmed expense movements not recurring/installment.
- Total spent: fixed plus installments plus variable expenses.
- Savings: confirmed savings contributions, excluding valuation changes.
- Monthly estimated result: confirmed income minus confirmed consumption minus registered savings.
- Percent spent: total spent divided by income when income is positive.
- Percent saved: savings divided by income when income is positive.

## Historical summaries

Purpose: Store initial historical monthly summaries for 2023, 2024 and 2025 without pretending detailed movement data exists.

Fields: `id`, `user_id`, `period_month`, `income_total`, `fixed_expense_total`, `variable_expense_total`, `installment_total`, `savings_total`, `source_import_id`, `notes`.

Relations: Belongs to an import and a user. Does not create movement rows.

Restrictions: Must be visually and technically separated from normalized movements.

Invariants: Historical summaries support year comparison but cannot be edited as movement-level facts.

Derived data: Historical annual comparison metrics.

Risks: Users may compare summary data with normalized data without noticing precision differences.

## Remaining model decisions

- Final exact enum names for movement `type`, `nature` and `status`.
- Whether account snapshots are needed in version 1.1 for operating-balance analysis.
- Final reconciliation policy when individual Mercado Pago expenses coexist with an estimated monthly difference.
