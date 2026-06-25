"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { MonthSelector } from "@/components/month-selector";
import { MovementRow } from "@/components/movement-row";
import { categories, paymentMethods } from "@/lib/mock-data";
import { getMovementsForMonth, usePrototypeStore } from "@/lib/prototype-store";

const quickFilters = [
  { value: "todos", label: "Todos" },
  { value: "variables", label: "Variables" },
  { value: "fijos", label: "Fijos" },
  { value: "cuotas", label: "Cuotas" },
  { value: "ingresos", label: "Ingresos" },
  { value: "ahorros", label: "Ahorros" },
];

type MovimientosClientProps = {
  initialQuickFilter: string;
};

export function MovimientosClient({ initialQuickFilter }: MovimientosClientProps) {
  const { state } = usePrototypeStore();
  const [quick, setQuick] = useState(initialQuickFilter);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("todos");
  const [nature, setNature] = useState("todos");
  const [category, setCategory] = useState("todos");
  const [payment, setPayment] = useState("todos");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const monthMovements = useMemo(() => getMovementsForMonth(state), [state]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const min = Number(minAmount || 0);
    const max = Number(maxAmount || Number.MAX_SAFE_INTEGER);

    return monthMovements.filter((movement) => {
      const quickMatch =
        quick === "todos" ||
        (quick === "variables" && movement.nature === "variable") ||
        (quick === "fijos" && movement.nature === "fijo") ||
        (quick === "cuotas" && movement.nature === "cuota") ||
        (quick === "ingresos" && movement.type === "ingreso") ||
        (quick === "ahorros" && movement.type === "ahorro");
      const textMatch =
        !normalizedSearch ||
        movement.description.toLowerCase().includes(normalizedSearch) ||
        movement.category.toLowerCase().includes(normalizedSearch);

      return (
        quickMatch &&
        textMatch &&
        (type === "todos" || movement.type === type) &&
        (nature === "todos" || movement.nature === nature) &&
        (category === "todos" || movement.category === category) &&
        (payment === "todos" || movement.paymentMethod === payment) &&
        movement.amount >= min &&
        movement.amount <= max
      );
    });
  }, [category, maxAmount, minAmount, monthMovements, nature, payment, quick, search, type]);

  function clearFilters() {
    setQuick("todos");
    setSearch("");
    setType("todos");
    setNature("todos");
    setCategory("todos");
    setPayment("todos");
    setMinAmount("");
    setMaxAmount("");
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Movimientos</p>
          <h1 className="mt-1 text-3xl font-semibold text-stone-950">Movimientos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Busqueda y filtros para revisar ingresos, gastos, cuotas y ahorros del mes.
          </p>
        </div>
        <MonthSelector />
      </header>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="block flex-1 text-sm font-medium text-stone-700" htmlFor="search">
            Buscar
            <input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
              placeholder="Ej: supermercado"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="min-h-11 rounded-lg border border-stone-300 px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
          >
            {showFilters ? "Ocultar filtros" : "Mas filtros"}
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setQuick(filter.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                quick === filter.value
                  ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <SelectFilter label="Tipo" value={type} onChange={setType} options={["todos", "ingreso", "gasto", "ahorro", "transferencia"]} />
            <SelectFilter label="Naturaleza" value={nature} onChange={setNature} options={["todos", "variable", "fijo", "cuota", "ingreso", "ahorro", "otro"]} />
            <SelectFilter label="Categoria" value={category} onChange={setCategory} options={["todos", ...categories, "Ingreso", "Ahorro USD"]} />
            <SelectFilter label="Medio de pago" value={payment} onChange={setPayment} options={["todos", ...paymentMethods, "ICBC pesos"]} />
            <AmountFilter label="Desde" value={minAmount} onChange={setMinAmount} />
            <AmountFilter label="Hasta" value={maxAmount} onChange={setMaxAmount} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3" aria-label="Resultados de movimientos">
        {filtered.length > 0 ? (
          filtered.map((movement) => <MovementRow key={movement.id} movement={movement} />)
        ) : (
          <EmptyState
            title="No hay movimientos para estos filtros"
            description="Proba limpiar la busqueda o volver a Todos."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Limpiar filtros
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "todos" ? "Todos" : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AmountFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
        inputMode="decimal"
        min="0"
        type="number"
      />
    </label>
  );
}
