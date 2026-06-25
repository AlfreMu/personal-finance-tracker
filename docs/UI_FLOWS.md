# UI Flows

## First entry

1. User signs in.
2. App checks whether initial setup exists.
3. If empty, show a minimal setup path: categories, payment methods, accounts, ICBC card and USD funds can be accepted from defaults.
4. Dashboard opens with empty states and the primary `+ Agregar movimiento` action.

Empty state copy should explain what is missing without showing tutorial walls.

## Monthly dashboard

1. User lands on the current month.
2. Top area shows income, total spent, savings and monthly estimated result.
3. Secondary blocks show recurring fixed expenses, installments and variable expenses.
4. Month controls allow previous/next month and year selection.
5. Each block links to a filtered movement list.
6. Comparison indicators show difference versus previous month.

## Fast ICBC card expense

1. User taps `+ Agregar movimiento`.
2. Form opens with defaults: expense, variable, ICBC card, today.
3. Visible priority fields: description, amount, category, date.
4. User saves.
5. Server validates ownership, amount, date, category and payment method.
6. Dashboard and movement list refresh.

Acceptance criteria:

- The default path requires no payment-method selection for normal ICBC card use.
- The form is usable with one thumb on mobile.
- A valid movement can be saved with description, amount, category and date.
- Invalid amount, missing description or missing category show clear inline errors.
- Save has pending state and avoids duplicate submissions.
- The saved purchase appears in the selected purchase month.
- The flow can complete in less than 10 seconds after routine use.

## Income entry

1. User chooses income.
2. Required fields: deposit date, amount, source and income type.
3. Optional field: note.
4. Last salary may be suggested but must require confirmation.
5. Confirmed income appears in monthly income and monthly estimated result.

## Recurring expense creation

1. User selects recurring fixed expense.
2. Required fields: description, category, current amount, payment method, start month and expected schedule.
3. User saves a recurring rule.
4. App can create or suggest monthly planned instances.
5. Monthly instances can be confirmed or edited.

## Installment purchase creation

1. User selects installment purchase.
2. Required fields: description, category, total amount or installment amount, number of installments, first installment number, start month, payment method.
3. App calculates end month and future committed balance.
4. App creates monthly installment records linked to the purchase.
5. Each month displays installment label and amount.

## Installment editing and deletion

1. User opens an installment or installment purchase.
2. If the installment is confirmed, only that installment can be edited.
3. If the installment is future/planned, the user can apply changes to only that installment or to that installment and the following installments.
4. Confirmed installments are never changed by future-installment edits.
5. Deleting a purchase preserves confirmed installments and cancels only future installments.
6. Any action affecting multiple installments requires explicit confirmation.

## Monthly recurrence confirmation

1. Dashboard or movements page shows planned recurring instances.
2. User reviews amount and date.
3. User confirms, edits or dismisses the instance.
4. Confirmed instances affect statistics; planned ones do not count as paid.

## Savings registration

1. User opens `Ahorros USD`.
2. User chooses movement type: opening balance, dollar purchase, fund contribution, withdrawal, fund transfer or valuation adjustment.
3. Form fields adapt to type.
4. Contributions can include pesos used and exchange rate.
5. Valuation adjustments do not affect savings contribution totals.

Opening balances for USD funds are entered as investment movements with type `opening_balance`. The 2026-06-25 opening balance does not affect income, expenses, monthly savings or return.

## Mercado Pago reconciliation

1. User opens a future Mercado Pago reconciliation view.
2. User enters opening balance, transfers received, other inflows, non-consumption outflows and closing balance.
3. App derives `consumo no detallado estimado`.
4. In the MVP this value is informational and is not added automatically to total spending.
5. A future workflow may convert the difference into a `pending_review` movement after user confirmation.

## Movement consultation

1. User opens `Movimientos`.
2. Defaults to current month.
3. User filters by type, nature, category, payment method, text or amount range.
4. User opens a movement detail.
5. User can edit, delete or add a note.
6. Installment edits ask whether the change applies only to one installment or to the remaining schedule.
7. Pending-review import records appear in a review inbox with source file, sheet and cell traceability.

## Statistics

1. User opens `Estadisticas`.
2. Monthly tab shows current month breakdown and comparison.
3. Annual tab shows accumulated values, averages and evolution.
4. Historical view compares years when enough data exists.
5. USD portfolio evolution appears separately from peso consumption statistics.

## Configuration

Configurable areas:

- Categories.
- Payment methods.
- Accounts.
- Cards.
- Income sources.
- Investment funds.
- Visual preferences.
- Export.
- Backup.
- Import.

Settings should be plain and utilitarian. Dangerous actions like full deletion or import rollback require confirmation.

## Empty states

- No income: prompt to register income, but do not assume salary.
- No expenses: show add movement action.
- No recurring rules: explain fixed expenses can be added from settings or add movement.
- No USD savings movements: offer opening balance setup.
- No import: explain that the 2026 import will run as a dry run first.
- Pending review inbox empty: confirm there are no unresolved imported records.

## Error states

- Validation errors stay near fields.
- Authorization failures redirect or show a short private-data-safe message.
- Import errors summarize counts and row references without exposing full personal transaction lists.
- Network/server errors allow retry without duplicate writes.

## Mobile-first experience

- Bottom navigation for primary sections.
- Persistent add action.
- Large touch targets.
- Compact metric cards or rows, not spreadsheet grids.
- Filters should collapse into a sheet/drawer on small screens.
- Forms should save with keyboard-friendly inputs for amount and date.
