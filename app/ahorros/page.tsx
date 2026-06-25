"use client";

import { StatBar } from "@/components/stat-bar";
import { formatARS, formatDate, formatUSD } from "@/lib/formatters";
import { getPortfolioSummary, usePrototypeStore } from "@/lib/prototype-store";
import type { SavingsMovementType } from "@/lib/mock-data";

const savingsTypeLabels: Record<SavingsMovementType, string> = {
  saldo_inicial: "Saldo inicial",
  aporte: "Aporte",
  retiro: "Retiro",
  transferencia: "Transferencia",
  ajuste_valuacion: "Ajuste de valuacion",
};

export default function AhorrosPage() {
  const { state } = usePrototypeStore();
  const portfolio = getPortfolioSummary(state);
  const recentMovements = state.savingsMovements.slice(0, 6);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Ahorros USD</p>
        <h1 className="mt-1 text-3xl font-semibold text-stone-950">Ahorros en dolares</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Aportes, retiros y valuaciones del portfolio. Las valuaciones no cuentan como ahorro mensual.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm font-medium text-cyan-900">Patrimonio total</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-cyan-950">{formatUSD(portfolio.total)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-600">Capital aportado</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-stone-950">{formatUSD(portfolio.contributed)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-900">Variacion de valuacion</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-950">{formatUSD(portfolio.valuationChange)}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Distribucion entre fondos</h2>
          <div className="mt-4 space-y-4">
            {portfolio.funds.length > 0 ? (
              portfolio.funds.map((fund, index) => (
                <StatBar
                  key={fund.name}
                  label={fund.name}
                  value={formatUSD(fund.amount)}
                  percent={portfolio.total > 0 ? (fund.amount / portfolio.total) * 100 : 0}
                  color={["bg-cyan-700", "bg-emerald-700", "bg-amber-600"][index] ?? "bg-stone-600"}
                />
              ))
            ) : (
              <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
                No hay fondos cargados.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Ultimos movimientos</h2>
          <div className="mt-4 space-y-3">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {savingsTypeLabels[movement.type]}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">{movement.fund}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-stone-950">{formatUSD(movement.usdAmount)}</p>
                    {movement.arsAmount > 0 ? (
                      <p className="mt-1 text-xs tabular-nums text-stone-600">{formatARS(movement.arsAmount)}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-stone-500">{formatDate(movement.date)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
