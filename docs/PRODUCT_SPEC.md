# Product Spec

## Problem

The product replaces a personal Excel workbook used to track income, card expenses, fixed obligations, installments and USD savings. The current workbook is useful conceptually but fragile: formulas are manual, totals can miss rows, card payments can be confused with consumption, transfers can be confused with expenses, and loading a normal purchase from a phone is too slow.

## Target user

Single primary user managing personal finances in Argentina, mostly from a phone, with one main credit card, ICBC peso account, Mercado Pago, occasional cash/debit movements and USD investment funds. The product should stay simpler than accounting software.

## Goals

- Understand the current month in seconds.
- Register a normal ICBC card expense in less than 10 seconds.
- Separate income, consumption, cash flow, transfers, savings and portfolio value.
- Track fixed recurring expenses without rewriting history when amounts change.
- Track installment purchases until their future commitment ends.
- Import 2026 data safely from Excel in a later phase.
- Keep data portable, private and easy to export.

## Scope

MVP operativo:

- Authentication.
- Monthly dashboard.
- Manual income entry.
- Fast ICBC variable card expense entry.
- Recurring expenses.
- Installment purchases.
- Basic movement list and filters.
- Basic monthly statistics required to validate the dashboard.
- USD savings section.
- 2026 import workflow.
- CSV or JSON export.
- Responsive, mobile-first UI.

Version 1.1:

- Advanced historical statistics.
- Complete Mercado Pago reconciliation.
- ICBC card statement payment and reconciliation.
- Restorable backups from the interface.
- Advanced visual configuration.
- Cash-flow and operating-balance analysis.

## Non-goals

- Automatic ICBC or Mercado Pago integrations.
- Automatic card statement parsing.
- Native mobile app.
- AI categorization.
- Multi-person shared finances.
- Family budgets.
- Real-time market pricing.
- Advanced notifications.
- Full double-entry accounting.

## Provider decision

The MVP will use Supabase/PostgreSQL, Supabase Auth and Row Level Security. The PostgreSQL schema should remain portable, migrations must be versioned, exports must cover all private data, and provider-specific features should be avoided unless they clearly simplify the MVP without locking core data away.

Supabase must not be configured until the implementation phase explicitly reaches authentication and persistence.

## Existing repository

Observed stack:

- Next.js `16.2.9`.
- React `19.2.4`.
- TypeScript strict mode.
- App Router under root `app/`, not `src/app`.
- Tailwind CSS 4 through `@tailwindcss/postcss`.
- ESLint 9 with `eslint-config-next`.
- No product routes implemented yet; current `app/page.tsx` is the create-next-app starter.

Future implementation should respect Next.js 16 App Router conventions:

- Pages and layouts are Server Components by default.
- Client Components should be limited to interactive islands.
- Mutations should use Server Actions when appropriate.
- Route Handlers should be reserved for APIs, webhooks, import/export and larger file flows.
- Authorization must be validated in server code, not only in navigation or client components.
- Next 16 uses `proxy.ts`, not `middleware.ts`, for request proxy behavior.

## Navigation

Initial navigation:

- Inicio.
- Movimientos.
- Estadisticas.
- Ahorros USD.
- Configuracion.

Mobile should use a bottom navigation bar. A primary action should remain easy to reach:

`+ Agregar movimiento`

## Core features

### Dashboard

The monthly dashboard must show:

- Income for selected month.
- Recurring fixed expenses.
- Installments due in the month.
- Variable expenses.
- Total spent.
- Registered savings for the month.
- Monthly estimated result.
- Percent spent.
- Percent saved.
- Month selector and year/month navigation.
- Comparison with previous month.
- Quick links to filtered movements behind each block.
- Persistent add movement action.

The dashboard can be inspired by the workbook but must not replicate the "months as columns" layout. It should prioritize hierarchy, mobile readability and fast comprehension.

### Movements

The movement list is unified but filterable by:

- Month and year.
- Movement type.
- Nature.
- Category.
- Payment method.
- Income.
- Fixed recurring expense.
- Installment.
- Variable expense.
- Savings.
- Free text.
- Amount range.

Each movement must support view, edit, delete, recategorize, date change and optional note. Editing or deleting one installment must have explicit behavior because it can affect a purchase schedule.

### Statistics

Monthly statistics:

- Income.
- Total expenses.
- Fixed expenses.
- Installments.
- Variable expenses.
- Savings.
- Monthly estimated result.
- Percent spent.
- Percent saved.
- Distribution by category.
- Five largest expenses.
- Main categories.
- Comparison with previous month.

Annual statistics:

- Accumulated income.
- Accumulated expenses.
- Accumulated savings.
- Monthly averages.
- Month with highest expense.
- Month with best savings rate.
- Annual savings rate.
- Monthly evolution.
- Expenses by category.
- USD portfolio evolution.

Historical statistics should allow year comparisons. Initial migration imports 2026 at movement level and imports 2023, 2024 and 2025 as historical monthly summaries separated from normalized movements. Advanced historical analysis belongs to version 1.1.

### USD savings

The section `Ahorros USD` tracks patrimony separately from monthly consumption. The known snapshot on 2026-06-25 is stored as investment movements with type `opening_balance`, not as June purchase, income, monthly savings or return:

- ALPHA RENTA FIJA GLOBAL: USD 1,233.00.
- Alpha Renta Capital Dolar: USD 202.23.
- Alpha Rta Corpo Dolar: USD 199.96.
- Total: USD 1,635.19.

Future activity must distinguish dollar purchases, fund contributions, withdrawals, transfers between funds, valuation adjustments and opening balances. A generic account snapshot model can be considered in a later version, but no separate opening-balances table is required for USD funds in the MVP.

### Mercado Pago

For the MVP, simplified Mercado Pago reconciliation is informational. The estimated difference must be displayed as `consumo no detallado estimado` and must not be automatically added to total spending. A later reconciliation policy can decide how individual Mercado Pago expenses coexist with the estimate and may convert the difference into a `pending_review` movement.

### Monthly estimated result

The dashboard indicator is:

`confirmed income - confirmed consumption - registered savings`

This is an economic monthly result based on registered movements. It is not a bank balance, Mercado Pago balance or exact operating cash-flow number. If the UI uses the word available, it must say `Disponible estimado segun movimientos registrados`.

## Initial editable categories

- Alimentacion.
- Transporte y moto.
- Deportes.
- Salud y cuidado personal.
- Educacion.
- Entretenimiento y suscripciones.
- Servicios e impuestos.
- Compras y equipamiento.
- Regalos.
- Mascotas.
- Tabaco.
- Otros.

The MVP should avoid deep hierarchies. Categories must be user-editable later.

## Success criteria

- The dashboard explains the month without spreadsheet knowledge.
- A normal card expense can be registered in less than 10 seconds.
- Card statement payments never duplicate expenses.
- Mercado Pago transfers are not counted as spending.
- Installment commitments are visible month by month and in the future.
- Recurring amount changes preserve historical months.
- Monthly totals are derived from normalized facts.
- 2026 import can be dry-run, validated and repeated safely.
- The user can export all private data.
