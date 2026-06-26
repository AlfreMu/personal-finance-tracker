"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { MonthSelector } from "@/components/month-selector";
import { MovementRow } from "@/components/movement-row";
import {
  cancelInstallmentPurchaseAction,
  deactivateRecurringRuleAction,
  deleteFinanceEntry,
  updateFinanceEntry,
} from "@/lib/finance/actions";
import type { FinanceCatalogs, FinanceMovement } from "@/lib/finance/types";

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
  selectedMonth: string;
  movements: FinanceMovement[];
  catalogs: FinanceCatalogs;
};

export function MovimientosClient({ initialQuickFilter, selectedMonth, movements, catalogs }: MovimientosClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quick, setQuick] = useState(initialQuickFilter);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("todos");
  const [nature, setNature] = useState("todos");
  const [category, setCategory] = useState("todos");
  const [payment, setPayment] = useState("todos");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<FinanceMovement | null>(null);
  const [deleting, setDeleting] = useState<FinanceMovement | null>(null);
  const [canceling, setCanceling] = useState<FinanceMovement | null>(null);
  const [error, setError] = useState<string>();

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const min = Number(minAmount || 0);
    const max = Number(maxAmount || Number.MAX_SAFE_INTEGER);

    return movements.filter((movement) => {
      const quickMatch =
        quick === "todos" ||
        (quick === "variables" && movement.nature === "variable") ||
        (quick === "fijos" && movement.nature === "recurring_fixed") ||
        (quick === "cuotas" && movement.nature === "installment") ||
        (quick === "ingresos" && movement.type === "income") ||
        (quick === "ahorros" && movement.type === "saving");
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
  }, [category, maxAmount, minAmount, movements, nature, payment, quick, search, type]);

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

  function toast(message: string) {
    window.dispatchEvent(new CustomEvent("finance-toast", { detail: { message } }));
  }

  function closeDialogs() {
    setEditing(null);
    setDeleting(null);
    setCanceling(null);
    setError(undefined);
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    formData.set("sourceKind", editing.source.kind);
    formData.set("sourceId", editing.source.id);
    startTransition(async () => {
      const result = await updateFinanceEntry(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast(result.message);
      closeDialogs();
      router.refresh();
    });
  }

  function submitDelete() {
    if (!deleting) return;
    const formData = new FormData();
    formData.set("sourceKind", deleting.source.kind);
    formData.set("sourceId", deleting.source.id);
    startTransition(async () => {
      const result = await deleteFinanceEntry(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast(result.message);
      closeDialogs();
      router.refresh();
    });
  }

  function submitCancelSeries() {
    if (!canceling?.source.parentId) return;
    const formData = new FormData();
    formData.set("parentId", canceling.source.parentId);
    formData.set("fromMonth", canceling.date.slice(0, 7));
    startTransition(async () => {
      const action = canceling.source.kind === "installment" ? cancelInstallmentPurchaseAction : deactivateRecurringRuleAction;
      const result = await action(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast(result.message);
      closeDialogs();
      router.refresh();
    });
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
        <MonthSelector selectedMonth={selectedMonth} />
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
            <SelectFilter label="Tipo" value={type} onChange={setType} options={["todos", "income", "expense", "saving", "transfer", "informational"]} />
            <SelectFilter label="Naturaleza" value={nature} onChange={setNature} options={["todos", "variable", "recurring_fixed", "installment", "investment", "internal_transfer", "other"]} />
            <SelectFilter label="Categoria" value={category} onChange={setCategory} options={["todos", ...catalogs.categories.map((item) => item.name), "Sin categoria"]} />
            <SelectFilter label="Medio de pago" value={payment} onChange={setPayment} options={["todos", ...catalogs.paymentMethods.map((item) => item.name), "Sin medio"]} />
            <AmountFilter label="Desde" value={minAmount} onChange={setMinAmount} />
            <AmountFilter label="Hasta" value={maxAmount} onChange={setMaxAmount} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3" aria-label="Resultados de movimientos">
        {filtered.length > 0 ? (
          filtered.map((movement) => (
            <MovementRow
              key={`${movement.source.kind}-${movement.id}`}
              movement={movement}
              onEdit={(item) => {
                setError(undefined);
                setEditing(item);
              }}
              onDelete={(item) => {
                setError(undefined);
                setDeleting(item);
              }}
              onCancelSeries={(item) => {
                setError(undefined);
                setCanceling(item);
              }}
            />
          ))
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

      {editing ? (
        <EditDialog
          movement={editing}
          catalogs={catalogs}
          error={error}
          pending={isPending}
          onClose={closeDialogs}
          onSubmit={submitEdit}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Eliminar movimiento"
          description={`Vas a eliminar "${deleting.description}". Esta accion no se puede deshacer.`}
          actionLabel="Eliminar"
          pending={isPending}
          error={error}
          onClose={closeDialogs}
          onConfirm={submitDelete}
        />
      ) : null}

      {canceling ? (
        <ConfirmDialog
          title={canceling.source.kind === "installment" ? "Cancelar compra" : "Desactivar recurrencia"}
          description={
            canceling.source.kind === "installment"
              ? "Se conservaran las cuotas confirmadas y se cancelaran las futuras."
              : "Se conservara el historial y se cancelaran las instancias futuras."
          }
          actionLabel={canceling.source.kind === "installment" ? "Cancelar compra" : "Desactivar"}
          pending={isPending}
          error={error}
          onClose={closeDialogs}
          onConfirm={submitCancelSeries}
        />
      ) : null}
    </div>
  );
}

function EditDialog({
  movement,
  catalogs,
  error,
  pending,
  onClose,
  onSubmit,
}: {
  movement: FinanceMovement;
  catalogs: FinanceCatalogs;
  error?: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isPeriodSource = movement.source.kind === "installment" || movement.source.kind === "recurring";
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-stone-950/45" onClick={onClose} aria-label="Cerrar edicion" />
      <form
        onSubmit={onSubmit}
        className="absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-stone-50 shadow-2xl md:bottom-auto md:top-0 md:h-full md:max-w-xl md:rounded-none"
      >
        <div className="border-b border-stone-200 bg-white px-5 py-4">
          <p className="text-sm font-medium text-emerald-700">Editar registro</p>
          <h2 className="text-xl font-semibold text-stone-950">Editar movimiento</h2>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!(isPeriodSource && movement.status !== "confirmed") ? <input type="hidden" name="scope" defaultValue="single" /> : null}
          {isPeriodSource ? (
            <Field label="Mes" name="date" defaultValue={movement.date.slice(0, 7)} type="month" />
          ) : (
            <Field label="Fecha" name="date" defaultValue={movement.date} type="date" />
          )}
          <Field label="Descripcion" name="description" defaultValue={movement.description} />
          <Field label="Importe" name="amount" defaultValue={String(movement.amount)} type="number" step="0.01" />

          {movement.type === "expense" ? (
            <>
              <Select name="categoryId" label="Categoria" defaultValue={movement.categoryId ?? ""} options={[{ id: "", name: "Sin categoria" }, ...catalogs.categories]} />
              <Select name="paymentMethodId" label="Medio de pago" defaultValue={movement.paymentMethodId ?? ""} options={[{ id: "", name: "Sin medio" }, ...catalogs.paymentMethods]} />
            </>
          ) : null}

          {movement.type === "income" ? (
            <Select name="incomeSourceId" label="Fuente" defaultValue={movement.incomeSourceId ?? ""} options={[{ id: "", name: "Sin fuente" }, ...catalogs.incomeSources]} />
          ) : null}

          {(movement.source.kind === "installment" || movement.source.kind === "recurring") && movement.status !== "confirmed" ? (
            <label className="block text-sm font-medium text-stone-700">
              Alcance
              <select name="scope" className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950">
                <option value="single">Solo esta</option>
                <option value="following">Esta y las siguientes</option>
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-medium text-stone-700">
            Nota
            <textarea
              name="note"
              defaultValue={movement.note ?? ""}
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
          </label>

          {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
        </div>
        <div className="flex gap-3 border-t border-stone-200 bg-white p-5">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="min-h-11 flex-1 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  actionLabel,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  actionLabel: string;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-stone-950/45" onClick={onClose} aria-label="Cerrar confirmacion" />
      <div className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700">
            Volver
          </button>
          <button type="button" disabled={pending} onClick={onConfirm} className="min-h-11 flex-1 rounded-full bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Procesando..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        type={type}
        step={step}
        min={type === "number" ? "0" : undefined}
        required={name !== "note"}
        className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { id: string; name: string }[];
}) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <select name={name} defaultValue={defaultValue} className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950">
        {options.map((option) => (
          <option key={option.id || "empty"} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
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
  const labels: Record<string, string> = {
    todos: "Todos",
    income: "Ingreso",
    expense: "Gasto",
    saving: "Ahorro",
    transfer: "Transferencia",
    informational: "Informativo",
    recurring_fixed: "Fijo",
    installment: "Cuota",
    investment: "Ahorro",
    internal_transfer: "Transferencia interna",
    other: "Otro",
  };

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
            {labels[option] ?? option}
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
