"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFinanceEntry, updateFinanceEntry } from "@/lib/finance/actions";
import type { FinanceCatalogs, PortfolioMovement } from "@/lib/finance/types";

const investmentTypeLabels: Record<string, string> = {
  opening_balance: "Saldo inicial",
  usd_purchase: "Compra USD",
  fund_contribution: "Aporte",
  withdrawal: "Retiro",
  fund_transfer: "Transferencia",
  valuation_adjustment: "Ajuste de valuacion",
};

export function InvestmentActions({ movement, catalogs }: { movement: PortfolioMovement; catalogs: FinanceCatalogs }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function toast(message: string) {
    window.dispatchEvent(new CustomEvent("finance-toast", { detail: { message } }));
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("sourceKind", "investment");
    formData.set("sourceId", movement.id);
    startTransition(async () => {
      const result = await updateFinanceEntry(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast(result.message);
      setEditing(false);
      setError(undefined);
      router.refresh();
    });
  }

  function submitDelete() {
    const formData = new FormData();
    formData.set("sourceKind", "investment");
    formData.set("sourceId", movement.id);
    startTransition(async () => {
      const result = await deleteFinanceEntry(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast(result.message);
      setDeleting(false);
      setError(undefined);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(true)} className="min-h-9 rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-700">
          Editar
        </button>
        <button type="button" onClick={() => setDeleting(true)} className="min-h-9 rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700">
          Eliminar
        </button>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-stone-950/45" onClick={() => setEditing(false)} aria-label="Cerrar edicion" />
          <form onSubmit={submitEdit} className="absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-stone-50 shadow-2xl md:bottom-auto md:top-0 md:h-full md:max-w-xl md:rounded-none">
            <div className="border-b border-stone-200 bg-white px-5 py-4">
              <p className="text-sm font-medium text-emerald-700">Editar registro</p>
              <h2 className="text-xl font-semibold text-stone-950">Editar movimiento</h2>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Field label="Fecha" name="date" defaultValue={movement.date} type="date" />
              <Select label="Tipo" name="investmentType" defaultValue={movement.type} options={Object.entries(investmentTypeLabels).map(([id, name]) => ({ id, name }))} />
              <Field label="USD" name="usdAmount" defaultValue={String(movement.usdAmount)} type="number" step="0.01" />
              <Field label="Pesos utilizados" name="arsUsed" defaultValue={movement.arsAmount ? String(movement.arsAmount) : ""} type="number" step="0.01" required={false} />
              <Field label="Tipo de cambio" name="exchangeRate" defaultValue={movement.exchangeRate ? String(movement.exchangeRate) : ""} type="number" step="0.000001" required={false} />
              <Select label="Fondo" name="fundId" defaultValue={movement.fundId ?? ""} options={catalogs.investmentFunds} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Origen" name="fromFundId" defaultValue={movement.fromFundId ?? ""} options={[{ id: "", name: "Seleccionar" }, ...catalogs.investmentFunds]} />
                <Select label="Destino" name="toFundId" defaultValue={movement.toFundId ?? ""} options={[{ id: "", name: "Seleccionar" }, ...catalogs.investmentFunds]} />
              </div>
              <label className="block text-sm font-medium text-stone-700">
                Nota
                <textarea name="note" defaultValue={movement.note ?? ""} rows={3} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-950" />
              </label>
              {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
            </div>
            <div className="flex gap-3 border-t border-stone-200 bg-white p-5">
              <button type="button" onClick={() => setEditing(false)} className="min-h-11 flex-1 rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="min-h-11 flex-1 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60">
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button type="button" className="absolute inset-0 bg-stone-950/45" onClick={() => setDeleting(false)} aria-label="Cerrar confirmacion" />
          <div className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-stone-950">Eliminar movimiento</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">La operacion se eliminara de forma atomica.</p>
            {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setDeleting(false)} className="min-h-11 flex-1 rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700">
                Volver
              </button>
              <button type="button" disabled={isPending} onClick={submitDelete} className="min-h-11 flex-1 rounded-full bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60">
                {isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, name, defaultValue, type = "text", step, required = true }: { label: string; name: string; defaultValue: string; type?: string; step?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}
      <input name={name} defaultValue={defaultValue} type={type} step={step} min={type === "number" ? "0" : undefined} required={required} className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950" />
    </label>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: { id: string; name: string }[] }) {
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
