"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  categories,
  incomeSources,
  investmentFunds,
  paymentMethods,
} from "@/lib/mock-data";
import type { SavingsMovementType } from "@/lib/mock-data";
import { usePrototypeStore } from "@/lib/prototype-store";
import { AddMovementMode } from "./open-movement-button";
import { IconClose } from "./icons";

type FormState = {
  description: string;
  amount: string;
  category: string;
  date: string;
  source: string;
  incomeType: string;
  note: string;
  paymentMethod: string;
  startMonth: string;
  endDate: string;
  totalAmount: string;
  installmentAmount: string;
  installmentCount: string;
  firstInstallment: string;
  usdAmount: string;
  arsUsed: string;
  exchangeRate: string;
  fund: string;
  usdMovementType: SavingsMovementType;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const modeLabels: Record<AddMovementMode, string> = {
  card: "Gasto con tarjeta",
  income: "Ingreso",
  recurring: "Gasto fijo recurrente",
  installment: "Compra en cuotas",
  usd: "Ahorro en dolares",
  other: "Otro movimiento",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return today().slice(0, 7);
}

function createInitialState(): FormState {
  return {
    description: "",
    amount: "",
    category: "",
    date: today(),
    source: incomeSources[0],
    incomeType: "Sueldo",
    note: "",
    paymentMethod: "Tarjeta ICBC",
    startMonth: currentMonth(),
    endDate: "",
    totalAmount: "",
    installmentAmount: "",
    installmentCount: "3",
    firstInstallment: "1",
    usdAmount: "",
    arsUsed: "",
    exchangeRate: "",
    fund: investmentFunds[0],
    usdMovementType: "aporte",
  };
}

function positive(value: string) {
  return Number(value) > 0;
}

function monthNameFromOffset(startMonth: string, count: number) {
  const [year, month] = startMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + Math.max(count - 1, 0), 2);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function AddMovementDrawer() {
  const router = useRouter();
  const { dispatch } = usePrototypeStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMovementMode>("card");
  const [form, setForm] = useState<FormState>(() => createInitialState());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [moreOptions, setMoreOptions] = useState(false);

  useEffect(() => {
    function onOpen(event: Event) {
      const custom = event as CustomEvent<{ mode?: AddMovementMode }>;
      setMode(custom.detail?.mode ?? "card");
      setForm(createInitialState());
      setErrors({});
      setMoreOptions(false);
      setOpen(true);
    }

    window.addEventListener("open-add-movement", onOpen);
    return () => window.removeEventListener("open-add-movement", onOpen);
  }, []);

  const preview = useMemo(() => {
    if (mode !== "installment") return "";
    const count = Number(form.installmentCount);
    const first = Number(form.firstInstallment);
    if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(first) || first <= 0) return "";
    return `Cuota ${first} de ${count} - finaliza en ${monthNameFromOffset(form.startMonth, count)}`;
  }, [form.firstInstallment, form.installmentCount, form.startMonth, mode]);

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: FieldErrors = {};

    if (["card", "recurring", "installment", "other"].includes(mode) && !form.description.trim()) {
      nextErrors.description = "Ingresa una descripcion.";
    }

    if (["card", "other"].includes(mode)) {
      if (!positive(form.amount)) nextErrors.amount = "El importe debe ser mayor que cero.";
      if (!form.category) nextErrors.category = "Elegi una categoria.";
      if (!form.date) nextErrors.date = "Elegi una fecha valida.";
    }

    if (mode === "income") {
      if (!positive(form.amount)) nextErrors.amount = "El importe debe ser mayor que cero.";
      if (!form.date) nextErrors.date = "Elegi una fecha valida.";
    }

    if (mode === "recurring") {
      if (!positive(form.amount)) nextErrors.amount = "El importe debe ser mayor que cero.";
      if (!form.category) nextErrors.category = "Elegi una categoria.";
      if (!form.startMonth) nextErrors.startMonth = "Elegi el mes de inicio.";
    }

    if (mode === "installment") {
      if (!form.category) nextErrors.category = "Elegi una categoria.";
      if (!positive(form.totalAmount)) nextErrors.totalAmount = "El total debe ser mayor que cero.";
      if (!positive(form.installmentAmount)) {
        nextErrors.installmentAmount = "El importe por cuota debe ser mayor que cero.";
      }
      if (!positive(form.installmentCount)) {
        nextErrors.installmentCount = "La cantidad de cuotas debe ser mayor que cero.";
      }
      if (!positive(form.firstInstallment)) {
        nextErrors.firstInstallment = "La primera cuota debe ser mayor que cero.";
      }
      if (!form.startMonth) nextErrors.startMonth = "Elegi el mes de inicio.";
    }

    if (mode === "usd") {
      if (!positive(form.usdAmount)) nextErrors.usdAmount = "Ingresa los USD.";
      if (form.usdMovementType === "aporte" && !positive(form.arsUsed)) {
        nextErrors.arsUsed = "Ingresa los pesos utilizados.";
      }
      if (!form.date) nextErrors.date = "Elegi una fecha valida.";
      if (!form.fund) nextErrors.fund = "Elegi un fondo o destino.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function resetAndClose() {
    setOpen(false);
    setForm(createInitialState());
    setErrors({});
    setMoreOptions(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !validate()) return;

    setPending(true);

    if (mode === "card") {
      dispatch({
        type: "ADD_CARD",
        input: {
          description: form.description.trim(),
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
        },
      });
    }

    if (mode === "income") {
      dispatch({
        type: "ADD_INCOME",
        input: {
          amount: Number(form.amount),
          date: form.date,
          source: form.source,
          incomeType: form.incomeType,
          note: form.note,
        },
      });
    }

    if (mode === "recurring") {
      dispatch({
        type: "ADD_RECURRING",
        input: {
          description: form.description.trim(),
          amount: Number(form.amount),
          category: form.category,
          paymentMethod: form.paymentMethod,
          startMonth: form.startMonth,
          endDate: form.endDate || undefined,
        },
      });
    }

    if (mode === "installment") {
      dispatch({
        type: "ADD_INSTALLMENT",
        input: {
          description: form.description.trim(),
          category: form.category,
          totalAmount: Number(form.totalAmount),
          installmentAmount: Number(form.installmentAmount),
          installmentCount: Number(form.installmentCount),
          firstInstallment: Number(form.firstInstallment),
          startMonth: form.startMonth,
          paymentMethod: form.paymentMethod,
        },
      });
    }

    if (mode === "usd") {
      dispatch({
        type: "ADD_SAVINGS",
        input: {
          date: form.date,
          type: form.usdMovementType,
          usdAmount: Number(form.usdAmount),
          arsAmount: Number(form.arsUsed || 0),
          exchangeRate: form.exchangeRate ? Number(form.exchangeRate) : undefined,
          fund: form.fund,
        },
      });
    }

    if (mode === "other") {
      dispatch({
        type: "ADD_OTHER",
        input: {
          description: form.description.trim(),
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
        },
      });
    }

    window.setTimeout(() => {
      setPending(false);
      resetAndClose();
      router.push("/");
    }, 180);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-stone-950/45 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={resetAndClose}
        aria-label="Cerrar formulario"
      />
      <aside
        className={`absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-stone-50 shadow-2xl transition-transform duration-200 md:bottom-auto md:top-0 md:h-full md:max-h-none md:max-w-xl md:rounded-none ${
          open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        inert={!open}
        aria-labelledby="add-movement-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Nuevo registro</p>
            <h2 id="add-movement-title" className="text-xl font-semibold text-stone-950">
              Agregar movimiento
            </h2>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            aria-label="Cerrar"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <SelectField
              id="movementType"
              label="Tipo de movimiento"
              value={mode}
              options={Object.entries(modeLabels).map(([value, label]) => ({ value, label }))}
              onChange={(value) => {
                setMode(value as AddMovementMode);
                setErrors({});
                setMoreOptions(false);
              }}
            />

            {mode !== "income" && mode !== "usd" ? (
              <TextField
                id="description"
                label="Descripcion"
                value={form.description}
                error={errors.description}
                onChange={(value) => update("description", value)}
              />
            ) : null}

            {mode === "card" ? (
              <>
                <MoneyField value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField
                  id="category"
                  label="Categoria"
                  value={form.category}
                  error={errors.category}
                  options={["", ...categories].map((option) => ({ value: option, label: option || "Seleccionar" }))}
                  onChange={(value) => update("category", value)}
                />
                <DateField value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
                  Medio de pago: <span className="font-semibold">Tarjeta ICBC</span>
                </p>
                <MoreOptions open={moreOptions} onToggle={() => setMoreOptions((value) => !value)}>
                  <SelectField
                    id="paymentMethod"
                    label="Medio de pago"
                    value={form.paymentMethod}
                    options={paymentMethods.map((option) => ({ value: option, label: option }))}
                    onChange={(value) => update("paymentMethod", value)}
                  />
                </MoreOptions>
              </>
            ) : null}

            {mode === "income" ? (
              <>
                <DateField label="Fecha de deposito" value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <MoneyField value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField
                  id="source"
                  label="Fuente"
                  value={form.source}
                  options={incomeSources.map((option) => ({ value: option, label: option }))}
                  onChange={(value) => update("source", value)}
                />
                <SelectField
                  id="incomeType"
                  label="Tipo de ingreso"
                  value={form.incomeType}
                  options={["Sueldo", "Honorarios", "Aguinaldo", "Reintegro", "Otro"].map((option) => ({ value: option, label: option }))}
                  onChange={(value) => update("incomeType", value)}
                />
                <TextField id="note" label="Nota opcional" value={form.note} onChange={(value) => update("note", value)} />
              </>
            ) : null}

            {mode === "recurring" ? (
              <>
                <MoneyField label="Importe actual" value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField
                  id="recurringCategory"
                  label="Categoria"
                  value={form.category}
                  error={errors.category}
                  options={["", ...categories].map((option) => ({ value: option, label: option || "Seleccionar" }))}
                  onChange={(value) => update("category", value)}
                />
                <MonthField value={form.startMonth} error={errors.startMonth} onChange={(value) => update("startMonth", value)} />
                <MoreOptions open={moreOptions} onToggle={() => setMoreOptions((value) => !value)}>
                  <SelectField
                    id="recurringPayment"
                    label="Medio de pago"
                    value={form.paymentMethod}
                    options={paymentMethods.map((option) => ({ value: option, label: option }))}
                    onChange={(value) => update("paymentMethod", value)}
                  />
                  <DateField label="Finalizacion opcional" value={form.endDate} onChange={(value) => update("endDate", value)} />
                </MoreOptions>
              </>
            ) : null}

            {mode === "installment" ? (
              <>
                <SelectField
                  id="installmentCategory"
                  label="Categoria"
                  value={form.category}
                  error={errors.category}
                  options={["", ...categories].map((option) => ({ value: option, label: option || "Seleccionar" }))}
                  onChange={(value) => update("category", value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <MoneyField
                    id="totalAmount"
                    label="Importe total"
                    value={form.totalAmount}
                    error={errors.totalAmount}
                    onChange={(value) => update("totalAmount", value)}
                  />
                  <MoneyField
                    id="installmentAmount"
                    label="Importe por cuota"
                    value={form.installmentAmount}
                    error={errors.installmentAmount}
                    onChange={(value) => update("installmentAmount", value)}
                  />
                  <NumberField
                    id="installmentCount"
                    label="Cantidad de cuotas"
                    value={form.installmentCount}
                    error={errors.installmentCount}
                    onChange={(value) => update("installmentCount", value)}
                  />
                  <NumberField
                    id="firstInstallment"
                    label="Primera cuota"
                    value={form.firstInstallment}
                    error={errors.firstInstallment}
                    onChange={(value) => update("firstInstallment", value)}
                  />
                </div>
                <MonthField value={form.startMonth} error={errors.startMonth} onChange={(value) => update("startMonth", value)} />
                <MoreOptions open={moreOptions} onToggle={() => setMoreOptions((value) => !value)}>
                  <SelectField
                    id="installmentPayment"
                    label="Medio de pago"
                    value={form.paymentMethod}
                    options={paymentMethods.map((option) => ({ value: option, label: option }))}
                    onChange={(value) => update("paymentMethod", value)}
                  />
                </MoreOptions>
                {preview ? (
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-950">
                    {preview}
                  </div>
                ) : null}
              </>
            ) : null}

            {mode === "usd" ? (
              <>
                <DateField value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <SelectField
                  id="usdMovementType"
                  label="Tipo de movimiento"
                  value={form.usdMovementType}
                  options={[
                    { value: "saldo_inicial", label: "Saldo inicial" },
                    { value: "aporte", label: "Aporte" },
                    { value: "retiro", label: "Retiro" },
                    { value: "transferencia", label: "Transferencia" },
                    { value: "ajuste_valuacion", label: "Ajuste de valuacion" },
                  ]}
                  onChange={(value) => update("usdMovementType", value)}
                />
                <NumberField id="usdAmount" label="USD" value={form.usdAmount} error={errors.usdAmount} onChange={(value) => update("usdAmount", value)} />
                <MoneyField id="arsUsed" label="Pesos utilizados" value={form.arsUsed} error={errors.arsUsed} onChange={(value) => update("arsUsed", value)} />
                <NumberField id="exchangeRate" label="Tipo de cambio" value={form.exchangeRate} onChange={(value) => update("exchangeRate", value)} />
                <SelectField
                  id="fund"
                  label="Fondo o destino"
                  value={form.fund}
                  error={errors.fund}
                  options={investmentFunds.map((option) => ({ value: option, label: option }))}
                  onChange={(value) => update("fund", value)}
                />
              </>
            ) : null}

            {mode === "other" ? (
              <>
                <MoneyField value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField
                  id="otherCategory"
                  label="Categoria"
                  value={form.category}
                  error={errors.category}
                  options={["", "Transferencia interna", "Ajuste informativo", "Otros"].map((option) => ({ value: option, label: option || "Seleccionar" }))}
                  onChange={(value) => update("category", value)}
                />
                <DateField value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
                  Se registra como movimiento informativo, sin sumarse al consumo.
                </p>
              </>
            ) : null}
          </div>

          <div className="border-t border-stone-200 bg-white p-5">
            <button
              type="submit"
              disabled={pending}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {pending ? "Guardando..." : "Guardar movimiento"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

type FieldProps = {
  id?: string;
  label?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

function fieldClass(error?: string) {
  return `mt-1 h-11 w-full rounded-lg border bg-white px-3 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 ${
    error ? "border-red-500" : "border-stone-300"
  }`;
}

function TextField({ id = "text", label = "Texto", value, error, onChange }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700" htmlFor={id}>
      {label}
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function MoneyField({ id = "amount", label = "Importe", value, error, onChange }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass(error)}
        inputMode="decimal"
        type="number"
        min="0"
        step="0.01"
      />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function NumberField({ id, label, value, error, onChange }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass(error)}
        inputMode="numeric"
        type="number"
        min="0"
        step="0.01"
      />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function DateField({ label = "Fecha", value, error, onChange }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700" htmlFor={label}>
      {label}
      <input id={label} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} type="date" />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function MonthField({ value, error, onChange }: Pick<FieldProps, "value" | "error" | "onChange">) {
  return (
    <label className="block text-sm font-medium text-stone-700" htmlFor="startMonth">
      Mes de inicio
      <input id="startMonth" value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} type="month" />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = FieldProps & {
  options: SelectOption[];
};

function SelectField({ id = "select", label = "Seleccionar", value, error, options, onChange }: SelectFieldProps) {
  return (
    <label className="block text-sm font-medium text-stone-700" htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)}>
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function MoreOptions({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between px-3 text-sm font-semibold text-stone-800"
      >
        Mas opciones
        <span aria-hidden="true">{open ? "-" : "+"}</span>
      </button>
      {open ? <div className="space-y-4 border-t border-stone-200 p-3">{children}</div> : null}
    </div>
  );
}
