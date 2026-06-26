"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, monthOptionsAround } from "@/lib/finance/date";

type MonthSelectorProps = {
  selectedMonth: string;
  label?: string;
};

export function MonthSelector({ selectedMonth, label = "Mes" }: MonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const months = monthOptionsAround(selectedMonth);

  function selectMonth(month: string) {
    const params = new URLSearchParams(searchParams);
    params.set("month", month);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => selectMonth(addMonths(selectedMonth, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100"
        aria-label="Mes anterior"
      >
        <span aria-hidden="true">{"<"}</span>
      </button>
      <label className="sr-only" htmlFor="month-selector">
        {label}
      </label>
      <select
        id="month-selector"
        value={selectedMonth}
        onChange={(event) => selectMonth(event.target.value)}
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
        onClick={() => selectMonth(addMonths(selectedMonth, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100"
        aria-label="Mes siguiente"
      >
        <span aria-hidden="true">{">"}</span>
      </button>
    </div>
  );
}
