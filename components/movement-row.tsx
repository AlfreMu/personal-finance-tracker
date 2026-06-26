"use client";

import type { FinanceMovement } from "@/lib/finance/types";
import { formatARS, formatDate } from "@/lib/formatters";

type MovementRowProps = {
  movement: FinanceMovement;
  onEdit?: (movement: FinanceMovement) => void;
  onDelete?: (movement: FinanceMovement) => void;
  onCancelSeries?: (movement: FinanceMovement) => void;
};

const typeLabels: Record<FinanceMovement["type"], string> = {
  income: "Ingreso",
  expense: "Gasto",
  saving: "Ahorro",
  transfer: "Transferencia",
  adjustment: "Ajuste",
  informational: "Informativo",
};

const natureLabels: Record<FinanceMovement["nature"], string> = {
  variable: "Variable",
  recurring_fixed: "Fijo",
  installment: "Cuota",
  investment: "Ahorro",
  internal_transfer: "Transferencia interna",
  other: "Otro",
};

export function MovementRow({ movement, onEdit, onDelete, onCancelSeries }: MovementRowProps) {
  const isIncome = movement.type === "income";
  const isSaving = movement.type === "saving";
  const amountPrefix = isIncome ? "+" : "-";

  return (
    <article className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-stone-950">{movement.description}</h3>
          {movement.status !== "confirmed" ? (
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
        {onEdit || onDelete || onCancelSeries ? (
          <div className="flex flex-wrap justify-end gap-2">
            {movement.source.canEdit && onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(movement)}
                className="min-h-9 rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                Editar
              </button>
            ) : null}
            {movement.source.canDelete && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(movement)}
                className="min-h-9 rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50"
              >
                Eliminar
              </button>
            ) : null}
            {movement.source.canCancelSeries && onCancelSeries ? (
              <button
                type="button"
                onClick={() => onCancelSeries(movement)}
                className="min-h-9 rounded-full border border-amber-200 px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                {movement.source.kind === "installment" ? "Cancelar compra" : "Desactivar"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
