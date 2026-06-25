"use client";

import { months } from "@/lib/mock-data";
import { usePrototypeStore } from "@/lib/prototype-store";

type MonthSelectorProps = {
  initialMonth?: string;
  label?: string;
};

export function MonthSelector({ initialMonth = "2026-06", label = "Mes" }: MonthSelectorProps) {
  const { state, dispatch } = usePrototypeStore();
  const selected = state.selectedMonth || initialMonth;

  const selectedIndex = months.findIndex((month) => month.value === selected);
  const canGoBack = selectedIndex > 0;
  const canGoForward = selectedIndex >= 0 && selectedIndex < months.length - 1;

  return (
    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        disabled={!canGoBack}
        onClick={() => canGoBack && dispatch({ type: "SET_MONTH", month: months[selectedIndex - 1].value })}
        className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Mes anterior"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <label className="sr-only" htmlFor="month-selector">
        {label}
      </label>
      <select
        id="month-selector"
        value={selected}
        onChange={(event) => dispatch({ type: "SET_MONTH", month: event.target.value })}
        className="h-10 min-w-36 rounded-full border-0 bg-transparent px-2 text-sm font-semibold text-stone-950 outline-none"
      >
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!canGoForward}
        onClick={() => canGoForward && dispatch({ type: "SET_MONTH", month: months[selectedIndex + 1].value })}
        className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Mes siguiente"
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
