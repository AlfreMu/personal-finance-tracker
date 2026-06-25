# Business Rules

## Movement concepts

1. A `consumption` is the economic event used for expense statistics.
2. A `cash_flow` is a money movement between accounts or out of an account.
3. A `transfer` between owned accounts is not a consumption.
4. A `saving` is a user contribution to savings or investments.
5. A `valuation_adjustment` changes patrimony but is not a user contribution.
6. A `planned` movement is expected but not paid or confirmed.
7. A `confirmed` movement is real and can affect statistics according to its type.
8. A `pending_review` movement is imported or entered without enough information and must not affect statistics until resolved.
9. The monthly estimated result is an economic indicator, not a bank or Mercado Pago balance.
10. Cash flow or operating balance requires account balances, transfers and card payments, and is not exact in the first MVP.

## Formal rules

BR-001. Income is entered manually only when actually received.

BR-002. The system may suggest the last salary amount but must never auto-create salary without confirmation.

BR-003. Honorarios and other irregular income must be supported without recurring assumptions.

BR-004. The default add-movement form must open as: type expense, nature variable, payment method ICBC card, date today.

BR-005. Fast card expense entry must prioritize description, amount, category and date.

BR-006. A credit card expense belongs to the month of purchase, not the month when the statement is paid.

BR-007. Paying the ICBC card statement is outside the first operational version. Later it may be added as a non-consumption cash-flow event, but it must never create another expense.

BR-008. A transfer from ICBC to Mercado Pago is internal and must not affect consumption totals.

BR-009. Mercado Pago simplified reconciliation is informational in the MVP. The estimated difference is shown as `consumo no detallado estimado` and is not automatically added to total spending.

BR-010. Recurring fixed expenses are long-lived obligations and must be modeled separately from installment purchases.

BR-011. Changing the current amount of a recurrence must not alter historical confirmed movement amounts.

BR-012. Installment purchases must track total amount, installment amount, count, current installment number, start month, payment method, calculated end month and future committed balance.

BR-013. A monthly installment must display its relation to the source purchase, for example `cuota 2 de 3`.

BR-014. Future planned installments must not appear as paid expenses until their status becomes confirmed.

BR-015. A confirmed installment can only be edited individually.

BR-016. A future installment can be edited only for that installment or for that installment and following installments.

BR-017. Editing future installments must not alter confirmed installments.

BR-018. Deleting an installment purchase preserves confirmed installments and cancels only future installments.

BR-019. Any operation affecting multiple installments requires explicit confirmation and must not silently rewrite history.

BR-020. Totals such as income, fixed expenses, installments, variables, total spent, percentages and monthly estimated result are derived from normalized records.

BR-021. Monthly estimated result is calculated as `confirmed income - confirmed consumption - registered savings`, with pending-review records excluded.

BR-022. The monthly estimated result must not be labeled as a bank balance, Mercado Pago balance or exact cash-flow result. If the UI uses available wording, it must say `Disponible estimado segun movimientos registrados`.

BR-023. USD opening balances are stored as investment movements with type `opening_balance`. They are patrimonial snapshots, not income, purchases, monthly savings or returns.

BR-024. USD purchases or fund contributions affect savings and patrimony; valuation adjustments affect patrimony but not savings contributions.

BR-025. Every private financial entity must be owned by a user/profile even if the app starts as single-user.

BR-026. Server-side authorization and Row Level Security are required for private financial data.

BR-027. `Gastos 2026!E16` is excluded by explicit user confirmation. It is not a financial record, must not be imported, must not become `pending_review`, must not appear in the application and must not generate migration warnings.

BR-028. Ambiguous import records other than explicitly excluded cells must be stored with `status=pending_review`, preserve source file, sheet and cell traceability, appear in a review inbox and remain excluded from all calculations until resolved.

## Examples

### Variable card expense

A purchase made on 2026-05-25 with ICBC card is a confirmed variable expense for May 2026. It affects consumption, monthly spending, category statistics and monthly estimated result for May. It does not wait for the June statement payment.

### Card statement payment

Paying the ICBC card statement in June is not part of the first operational version. Later it can be recorded as a cash-flow or reconciliation event, but it must not affect consumption totals because the underlying purchases were already counted in their purchase months.

### Transfer to Mercado Pago

Moving pesos from ICBC to Mercado Pago is an internal transfer. It affects cash flow between accounts but not consumption, savings or monthly spending.

### Mercado Pago estimated reconciliation

A monthly Mercado Pago reconciliation may calculate `consumo no detallado estimado` from balances and non-consumption flows. In the MVP this value is informational and is not automatically included in total spending.

### Recurring expense

A monthly service such as cellphone, gym or subscription is represented by a recurring rule and monthly generated instances. If the amount changes in July, confirmed January-June movements keep their original amounts.

### Installment purchase

A purchase split into three card installments creates one purchase record and three monthly installment records. Each installment can be planned first and confirmed later. The future commitment is the sum of unpaid remaining installments.

Confirmed installments can only be edited one by one. Future installments can be edited individually or from a selected installment onward, with explicit confirmation. Deleting the purchase preserves confirmed installments and cancels only future installments.

### Income

Salary received on a deposit date is entered manually as income with source and income type. It affects income totals and monthly estimated result only when confirmed.

### Dollar purchase

Buying USD for a fund contribution records USD amount, pesos used, exchange rate and destination fund. It affects savings contribution and patrimony, but it is not consumption.

### Valuation adjustment

If a fund value rises without a new user contribution, record a valuation adjustment. It changes current patrimony and return reporting but not monthly savings contribution.

## Effect matrix

| Movement kind | Consumption | Cash flow | Savings | Patrimony | Monthly estimated result |
| --- | --- | --- | --- | --- | --- |
| Confirmed income | No | Optional | No | No | Increases |
| Variable expense | Yes | Optional | No | No | Decreases |
| Recurring fixed expense | Yes | Optional | No | No | Decreases |
| Confirmed installment | Yes | Optional | No | No | Decreases |
| Card statement payment | No | Yes | No | No | No direct effect |
| Internal transfer | No | Yes | No | No | No direct effect |
| USD purchase/contribution | No | Yes | Yes | Yes | Decreases |
| Fund-to-fund transfer | No | Yes | No | Reallocates | No direct effect |
| Valuation adjustment | No | No | No | Yes | No direct effect |
| Pending review | No | No | No | No | Excluded |
