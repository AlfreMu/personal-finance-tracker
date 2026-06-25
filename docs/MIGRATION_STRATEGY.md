# Migration Strategy

The future import must be repeatable, private and reversible. It must not depend on manually running hundreds of SQL statements.

## Source handling

- Read `data/private/Gastos.xlsx` in place.
- Do not modify, move, rename or copy the workbook.
- Do not write extracted real data to `public/`.
- Do not commit intermediate files containing real movements.
- Redact import logs to row references, counts, warnings and categories, not full personal lists.

## Extraction

Use a scriptable importer that reads workbook sheets and emits a private intermediate file during a controlled run. The script should capture:

- Sheet name.
- Cell coordinate or row/column source.
- Source year/month.
- Raw description.
- Raw amount.
- Source block: income, variables, fixed, savings or auxiliary.
- Formula versus hardcoded value.
- Confidence level.

The extraction must not trust total rows or formula rows as source of truth for movements.

`Gastos 2026!E16` must be excluded during extraction or normalization because the user explicitly confirmed it is not part of the financial data set. It must not be imported, persisted as `pending_review`, shown in the app, included in validations or reported as a warning.

## Normalization

Normalize each candidate row into a typed intermediate schema:

- `record_id`.
- `source_sheet`.
- `source_coordinate`.
- `period_month`.
- `description`.
- `amount`.
- `currency`.
- `candidate_type`.
- `candidate_nature`.
- `candidate_category`.
- `candidate_payment_method`.
- `status`.
- `confidence`.
- `warnings`.

Intermediate records should be JSON Lines or CSV plus a schema file. JSON Lines is recommended because warnings and metadata are easier to preserve.

## Category mapping

Create a mapping file that maps workbook labels to the editable category list. Mapping must support:

- Exact matches.
- Manual overrides.
- Unknown category fallback to `Otros` only when approved.
- Pending-review category for unresolved records.

No real private examples should be placed in public fixtures.

## Recurrence identification

Recurring expenses can be detected by repeated labels across months in the fixed block. The importer should propose recurring rules but not silently classify every repeated row as permanent.

Detection signals:

- Same or similar label in the fixed block across multiple months.
- Monthly cadence.
- No known finite installment count.

Outputs:

- Proposed recurring rule.
- Monthly instances with amount snapshots.
- Confidence and warning when labels change.

## Installment identification

Installments can appear as repeated labels over a finite number of months, often in the lower fixed/commitment block. The importer should propose installment purchases when:

- The label repeats for a limited run.
- Amount is stable or explainably rounded.
- The sequence has a clear start and expected end.

Ambiguous repeated labels should remain pending review rather than becoming fixed expenses.

## Planned versus real

Future month entries in the workbook may be planned commitments. The importer must mark:

- Past confirmed movements when the data is known real.
- Future planned instances for obligations not yet paid.
- Pending-review rows when source meaning is unclear.

The import should never make future planned movements look like paid expenses.

## Explicitly excluded cell

`Gastos 2026!E16` is an isolated annotation excluded by explicit user confirmation. It is not income, expense, savings, transfer or any financial movement. The importer should maintain an exclusion rule for this coordinate and should not generate warnings for it.

## Ambiguous records

Ambiguous records other than explicitly excluded cells must be stored with `status=pending_review`. They must preserve traceability to source file, sheet and cell, appear in a review inbox and remain excluded from every calculation until the user resolves them.

## Dry run

Dry run must:

- Read workbook and mapping files.
- Produce normalized candidate records.
- Validate schema.
- Report totals by month from candidate movements.
- Compare derived totals with workbook total rows only as a warning signal.
- List ambiguous and skipped rows by source coordinate.
- Write no database rows.

## Idempotency and duplicate prevention

Each imported record should have a deterministic fingerprint from:

- User id.
- Source file hash.
- Sheet name.
- Source coordinate or stable row identity.
- Period month.
- Normalized description.
- Amount.
- Candidate type.

Database constraints should prevent duplicate imports for the same fingerprint. Re-running the same import should either no-op or update only import metadata.

## Monthly validation

For each month, validate:

- Income candidate count and total.
- Fixed expense candidate total.
- Variable expense candidate total.
- Installment candidate total.
- Pending-review total.
- Difference between derived movement total and workbook formula total.

Differences are expected because workbook formulas may be wrong. They should be reported, not automatically "fixed" by copying totals.

## Import report

The report should include:

- Source file name and hash.
- Sheets processed.
- Records extracted.
- Records imported.
- Records skipped.
- Pending-review records.
- Warnings by month.
- Duplicate count.
- Rollback batch id.

Avoid printing full transaction lists. Use source coordinates and summarized descriptions only when necessary for review.

## Rollback

Every import run gets an `import_id`. A rollback should:

- Delete or mark inactive all rows created by that import id.
- Refuse rollback if rows were manually edited after import unless user confirms.
- Preserve the import audit record and rollback timestamp.

## Historical years

Decision:

- Import 2026 at movement level.
- Import 2023, 2024 and 2025 initially as monthly historical summaries.
- Keep historical summaries clearly separated from normalized movements.
- Do not simulate movement detail that does not exist.
