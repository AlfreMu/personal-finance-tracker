# Source Data Audit

This audit is based on read-only inspection of:

- `data/private/Gastos.xlsx`.
- `data/private/referencia-excel-1.png`.
- `data/private/referencia-excel-2.png`.

No private files were modified, moved, renamed or copied.

## Workbook sheets found

- `Gastos 2026`: 72 rows x 18 columns, 546 non-empty cells, 65 formulas.
- `Gastos 2025`: 75 rows x 34 columns, 772 non-empty cells, 75 formulas.
- `Gastos 2024`: 75 rows x 18 columns, 695 non-empty cells, 70 formulas.
- `Gastos 2023`: 49 rows x 15 columns, 247 non-empty cells, 43 formulas.
- `Costo Moto`: 13 rows x 18 columns, 96 non-empty cells, 19 formulas.

No merged cells were found in the inspected workbook.

## General organization

The main yearly sheets use months as columns and financial concepts as row blocks. The 2026 sheet has top summary rows for salary, USD price, USD equivalent, fixed total, variable total, total month expense, salary remainder and USDT savings. Below that are visual blocks for variable expenses and fixed expenses.

The screenshots confirm a spreadsheet-style layout with:

- Month columns.
- Colored summary rows.
- Variable expenses represented by alternating description and amount rows.
- Fixed expenses represented by recurring labels and amount rows.
- Future months with repeated planned commitments.

## Income representation

Income is represented mainly as a salary row near the top of each monthly column. The workbook does not model income as individual events with deposit date, source, type or note. This is insufficient for the target app, where income must be manually confirmed when received.

## Variable expenses representation

Variable expenses appear in a `GASTOS VAR.` block with descriptions and amounts placed by month. They are useful as raw candidates, but they lack normalized fields such as category, payment method, status and unique id.

## Fixed expenses representation

Fixed expenses appear in a `GASTOS FIJOS` block with repeated labels across months. Some rows are long-lived recurring obligations, while others appear to be temporary commitments or installment-like records. The workbook does not clearly separate those concepts.

## Installments representation

Installment-like items are present as repeated labels and amounts across a finite number of months. However, the workbook does not store a source purchase, installment count, installment number, start month, end month or future committed balance as normalized data.

## Savings representation

The main sheets include an `AHORRO EN USDT` row, but the workbook does not provide a complete normalized model for USD patrimony, contributions, withdrawals, transfers between funds or valuation adjustments. The known 2026-06-25 USD fund values should be treated as opening patrimony outside monthly income and spending.

## Real versus planned data

Past months appear to contain actual spending, while future months may include planned fixed expenses or installment commitments. The workbook does not encode status. The importer must infer or ask for review instead of treating every future entry as confirmed.

## Formula structure

The 2026 totals use formulas with explicit cell lists. Examples observed structurally:

- Fixed total sums selected amount rows in the fixed block.
- Variable total sums selected amount rows in the variable block.
- Total month expense sums fixed and variable totals.
- Salary remainder subtracts total expense from salary.

This confirms a high risk of formula fragility: adding a new row does not guarantee the total includes it.

## Inconsistencies and risks

- Totals are derived from manually maintained formula ranges.
- Months are columns rather than normalized dates.
- Descriptions and amounts are spread across row pairs.
- Categories are not explicit.
- Payment methods are not explicit per movement.
- Recurring obligations and installments are mixed visually.
- Future planned rows are not formally separated from real rows.
- Cash flow events such as card statement payments or transfers are not modeled separately.
- Workbook totals should not be the source of truth for import.

## Missing fields for target model

- Movement id.
- User owner.
- Exact movement date for every row.
- Category.
- Payment method.
- Account.
- Status: planned, confirmed, pending review.
- Source type: manual, recurring, installment, import.
- Installment metadata.
- Recurrence rule metadata.
- Import batch id and source fingerprint.
- Notes.

## Explicitly excluded cell

`Gastos 2026!E16` is an isolated cell excluded by explicit user confirmation. It is not income, expense, savings, transfer or any financial movement, and it is outside the financial data set. It must not be imported, persisted as `pending_review`, shown in the application, included in statistics or reported as a migration warning.

## Differences from proposed model

The proposed model replaces spreadsheet layout with normalized records:

- Months become dates/periods on movements.
- Totals become queries, not saved workbook totals.
- Fixed recurring expenses become rules plus monthly instances.
- Installments become purchase plus installment schedule.
- Transfers become internal cash-flow movements.
- USD patrimony uses investment movements, including `opening_balance` entries for the 2026-06-25 fund snapshot.
- Imports become auditable batches with idempotency and rollback.
