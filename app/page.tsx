import Link from "next/link";
import { MonthSelector } from "@/components/month-selector";
import { MetricCard } from "@/components/metric-card";
import { MovementRow } from "@/components/movement-row";
import { getFinancePageData } from "@/lib/finance/queries";
import { formatARS, formatPercent } from "@/lib/formatters";

type HomeProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const data = await getFinancePageData(params.month);
  const spentPercent = data.summary.income > 0 ? data.summary.totalSpent / data.summary.income : 0;
  const savingsPercent = data.summary.income > 0 ? data.summary.savings / data.summary.income : 0;
  const monthDelta = data.summary.totalSpent - data.previousSummary.totalSpent;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Inicio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-stone-950">Resumen mensual</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Una lectura rapida del mes seleccionado, con ingresos, gastos y resultado estimado.
          </p>
        </div>
        <MonthSelector selectedMonth={data.selectedMonth} />
      </header>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Indicadores principales">
        <MetricCard label="Ingresos" value={formatARS(data.summary.income)} helper="Movimientos confirmados" tone="positive" />
        <MetricCard label="Total gastado" value={formatARS(data.summary.totalSpent)} helper={`${formatPercent(spentPercent)} de los ingresos`} />
        <MetricCard
          label="Resultado estimado del mes"
          value={formatARS(data.summary.estimatedResult)}
          helper={`Ahorro registrado: ${formatARS(data.summary.savings)} (${formatPercent(savingsPercent)})`}
          tone={data.summary.estimatedResult >= 0 ? "accent" : "warning"}
        />
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Gastos del mes</h2>
          <p className="text-sm text-stone-600">
            {monthDelta === 0
              ? "El gasto total se mantiene igual que el mes anterior."
              : `Vas ${formatARS(Math.abs(monthDelta))} ${monthDelta > 0 ? "arriba" : "abajo"} del mes anterior.`}
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ExpenseBlock href={`/movimientos?month=${data.selectedMonth}&filtro=fijos`} label="Gastos fijos" value={formatARS(data.summary.fixed)} helper="Servicios y obligaciones" />
          <ExpenseBlock href={`/movimientos?month=${data.selectedMonth}&filtro=cuotas`} label="Cuotas" value={formatARS(data.summary.installments)} helper="Compromisos temporales" />
          <ExpenseBlock href={`/movimientos?month=${data.selectedMonth}&filtro=variables`} label="Gastos variables" value={formatARS(data.summary.variable)} helper="Consumos puntuales" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-950">Ultimos movimientos</h2>
            <Link href={`/movimientos?month=${data.selectedMonth}`} className="text-sm font-semibold text-emerald-700 hover:text-emerald-900">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.latestMovements.length > 0 ? (
              data.latestMovements.map((movement) => <MovementRow key={movement.id} movement={movement} />)
            ) : (
              <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">No hay movimientos para este mes.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Proximos compromisos</h2>
          <div className="mt-4 space-y-3">
            {data.commitments.length > 0 ? (
              data.commitments.map((commitment) => (
                <div key={commitment.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">{commitment.name}</p>
                  <p className="mt-1 text-sm text-stone-600">{commitment.detail} - {commitment.month}</p>
                  <p className="mt-2 text-base font-semibold tabular-nums text-stone-950">{formatARS(commitment.amount)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-stone-50 p-3 text-sm text-stone-600">No hay cuotas planificadas desde este mes.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExpenseBlock({ href, label, value, helper }: { href: string; label: string; value: string; helper: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-stone-200 bg-stone-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-stone-950">{value}</p>
      <p className="mt-1 text-sm text-stone-600">{helper}</p>
    </Link>
  );
}
