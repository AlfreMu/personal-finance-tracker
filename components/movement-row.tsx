import type { Movement } from "@/lib/mock-data";
import { formatARS, formatDate } from "@/lib/formatters";

type MovementRowProps = {
  movement: Movement;
};

const typeLabels: Record<Movement["type"], string> = {
  ingreso: "Ingreso",
  gasto: "Gasto",
  ahorro: "Ahorro",
  transferencia: "Transferencia",
};

const natureLabels: Record<Movement["nature"], string> = {
  variable: "Variable",
  fijo: "Fijo",
  cuota: "Cuota",
  ingreso: "Ingreso",
  ahorro: "Ahorro",
  otro: "Otro",
};

export function MovementRow({ movement }: MovementRowProps) {
  const isIncome = movement.type === "ingreso";
  const isSaving = movement.type === "ahorro";
  const amountPrefix = isIncome ? "+" : "-";

  return (
    <article className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-stone-950">{movement.description}</h3>
          {movement.status !== "confirmado" ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
              Planificado
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
          <span>{formatDate(movement.date)}</span>
          <span>{movement.category}</span>
          <span>{movement.paymentMethod}</span>
          <span>{natureLabels[movement.nature]}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700">
          {typeLabels[movement.type]}
        </span>
        <span
          className={`text-base font-semibold tabular-nums ${
            isIncome ? "text-emerald-700" : isSaving ? "text-cyan-700" : "text-stone-950"
          }`}
        >
          {amountPrefix}
          {formatARS(movement.amount)}
        </span>
      </div>
    </article>
  );
}
