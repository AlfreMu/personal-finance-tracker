"use client";

import { useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { MonthSelector } from "@/components/month-selector";
import { StatBar } from "@/components/stat-bar";
import type { FinancePageData } from "@/lib/finance/types";
import { formatARS, formatPercent } from "@/lib/formatters";

export function EstadisticasClient({ data }: { data: FinancePageData }) {
  const [tab, setTab] = useState<"mensual" | "anual">("mensual");
  const summary = data.summary;
  const previousSummary = data.previousSummary;
  const categoryTotals = data.categoryTotals;
  const topExpenses = data.topExpenses;
  const annualEvolution = data.annualEvolution;
  const annualIncome = annualEvolution.reduce((sum, item) => sum + item.income, 0);
  const annualExpenses = annualEvolution.reduce((sum, item) => sum + item.expenses, 0);
  const annualSavings = annualEvolution.reduce((sum, item) => sum + item.savings, 0);
  const maxExpense = annualEvolution.reduce((max, item) => Math.max(max, item.expenses), 0);
  const bestSaving = annualEvolution.reduce(
    (best, item) => {
      const rate = item.income > 0 ? item.savings / item.income : 0;
      return rate > best.rate ? { label: item.label, rate } : best;
    },
    { label: "-", rate: 0 },
  );
  const spentPercent = summary.income > 0 ? summary.totalSpent / summary.income : 0;
  const savingsPercent = summary.income > 0 ? summary.savings / summary.income : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Estadisticas</p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-950">Estadisticas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Proporciones, mayores gastos y evolucion para entender el comportamiento del mes.
          </p>
        </div>
        <MonthSelector selectedMonth={data.selectedMonth} />
      </header>

      <div className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
        {(["mensual", "anual"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`min-h-10 rounded-full px-5 text-sm font-semibold transition ${
              tab === item ? "bg-emerald-700 text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {item === "mensual" ? "Mensual" : "Anual"}
          </button>
        ))}
      </div>

      {tab === "mensual" ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ingresos" value={formatARS(summary.income)} tone="positive" />
            <MetricCard label="Gastos" value={formatARS(summary.totalSpent)} />
            <MetricCard label="Ahorro" value={formatARS(summary.savings)} tone="accent" />
            <MetricCard label="Resultado estimado" value={formatARS(summary.estimatedResult)} tone="warning" />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Distribucion por categorias">
              {categoryTotals.length > 0 ? (
                <div className="space-y-4">
                  {categoryTotals.map((category) => (
                    <StatBar
                      key={category.name}
                      label={category.name}
                      value={formatARS(category.amount)}
                      percent={summary.totalSpent > 0 ? (category.amount / summary.totalSpent) * 100 : 0}
                      color={category.color}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanelText>No hay gastos confirmados para este mes.</EmptyPanelText>
              )}
            </Panel>

            <Panel title="Cinco mayores gastos">
              {topExpenses.length > 0 ? (
                <div className="space-y-3">
                  {topExpenses.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">{movement.description}</p>
                        <p className="text-xs text-stone-600">{movement.category}</p>
                      </div>
                      <p className="font-semibold tabular-nums text-stone-950">{formatARS(movement.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanelText>No hay gastos para ordenar.</EmptyPanelText>
              )}
            </Panel>
          </section>

          <Panel title="Lectura del mes">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatBar label="Gasto sobre ingresos" value={formatPercent(spentPercent)} percent={spentPercent * 100} />
              <StatBar label="Ahorro sobre ingresos" value={formatPercent(savingsPercent)} percent={savingsPercent * 100} color="bg-cyan-700" />
              <StatBar
                label="Gasto mes anterior"
                value={formatARS(previousSummary.totalSpent)}
                percent={summary.totalSpent > 0 ? (previousSummary.totalSpent / summary.totalSpent) * 100 : 0}
                color="bg-stone-500"
              />
            </div>
          </Panel>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ingresos acumulados" value={formatARS(annualIncome)} tone="positive" />
            <MetricCard label="Gastos acumulados" value={formatARS(annualExpenses)} />
            <MetricCard label="Ahorro acumulado" value={formatARS(annualSavings)} tone="accent" />
            <MetricCard
              label="Promedio mensual"
              value={formatARS(annualEvolution.length > 0 ? Math.round(annualExpenses / annualEvolution.length) : 0)}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Evolucion mensual">
              {annualEvolution.length > 0 ? (
                <div className="space-y-5">
                  {annualEvolution.map((item) => (
                    <div key={item.month} className="grid gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-stone-800">{item.label}</span>
                        <span className="tabular-nums text-stone-600">{formatARS(item.expenses)}</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-emerald-700"
                            style={{ width: `${maxExpense > 0 ? (item.expenses / maxExpense) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-500">gasto</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanelText>No hay meses con movimientos.</EmptyPanelText>
              )}
            </Panel>

            <Panel title="Lecturas anuales">
              <div className="space-y-4 text-sm">
                <InfoRow
                  label="Mes con mayor gasto"
                  value={annualEvolution.find((item) => item.expenses === maxExpense)?.label ?? "-"}
                />
                <InfoRow label="Mejor tasa de ahorro" value={`${bestSaving.label} (${formatPercent(bestSaving.rate)})`} />
                <InfoRow label="Meses con actividad" value={String(annualEvolution.length)} />
              </div>
            </Panel>
          </section>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyPanelText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">{children}</p>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="font-medium text-stone-600">{label}</p>
      <p className="mt-1 font-semibold text-stone-950">{value}</p>
    </div>
  );
}
