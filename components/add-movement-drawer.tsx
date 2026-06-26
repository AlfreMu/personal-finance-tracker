"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFinanceEntry } from "@/lib/finance/actions";
import type { FinanceCatalogs } from "@/lib/finance/types";
import { createClient } from "@/lib/supabase/client";
import { AddMovementMode } from "./open-movement-button";
import { IconClose } from "./icons";

type FormState = {
  description: string;
  amount: string;
  categoryId: string;
  date: string;
  incomeSourceId: string;
  incomeType: string;
  note: string;
  paymentMethodId: string;
  startMonth: string;
  endMonth: string;
  totalAmount: string;
  installmentAmount: string;
  installmentCount: string;
  firstInstallment: string;
  usdAmount: string;
  arsUsed: string;
  exchangeRate: string;
  fundId: string;
  fromFundId: string;
  toFundId: string;
  usdMovementType: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyCatalogs: FinanceCatalogs = {
  categories: [],
  paymentMethods: [],
  incomeSources: [],
  investmentFunds: [],
};

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

function createInitialState(catalogs: FinanceCatalogs): FormState {
  const defaultPayment = catalogs.paymentMethods.find((item) => item.name === "Tarjeta ICBC") ?? catalogs.paymentMethods[0];
  const firstFund = catalogs.investmentFunds[0];
  return {
    description: "",
    amount: "",
    categoryId: "",
    date: today(),
    incomeSourceId: catalogs.incomeSources[0]?.id ?? "",
    incomeType: "Sueldo",
    note: "",
    paymentMethodId: defaultPayment?.id ?? "",
    startMonth: currentMonth(),
    endMonth: "",
    totalAmount: "",
    installmentAmount: "",
    installmentCount: "3",
    firstInstallment: "1",
    usdAmount: "",
    arsUsed: "",
    exchangeRate: "",
    fundId: firstFund?.id ?? "",
    fromFundId: firstFund?.id ?? "",
    toFundId: catalogs.investmentFunds[1]?.id ?? "",
    usdMovementType: "fund_contribution",
  };
}

function positive(value: string) {
  return Number(value) > 0;
}

function monthNameFromOffset(startMonth: string, count: number) {
  const [year, month] = startMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + Math.max(count - 1, 0), 2);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(date);
}

function toast(message: string) {
  window.dispatchEvent(new CustomEvent("finance-toast", { detail: { message } }));
}

export function AddMovementDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMovementMode>("card");
  const [catalogs, setCatalogs] = useState<FinanceCatalogs>(emptyCatalogs);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [form, setForm] = useState<FormState>(() => createInitialState(emptyCatalogs));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [moreOptions, setMoreOptions] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadCatalogs() {
      const supabase = createClient();
      const [categories, paymentMethods, incomeSources, investmentFunds] = await Promise.all([
        supabase.from("categories").select("id,name,color").eq("is_active", true).order("sort_order"),
        supabase.from("payment_methods").select("id,name,kind").eq("is_active", true).order("is_default", { ascending: false }).order("name"),
        supabase.from("income_sources").select("id,name,default_type").eq("is_active", true).order("name"),
        supabase.from("investment_funds").select("id,name,provider").eq("is_active", true).order("name"),
      ]);
      const nextCatalogs = {
        categories: categories.data?.map((item) => ({ id: item.id, name: item.name, color: item.color })) ?? [],
        paymentMethods: paymentMethods.data?.map((item) => ({ id: item.id, name: item.name, kind: item.kind })) ?? [],
        incomeSources: incomeSources.data?.map((item) => ({ id: item.id, name: item.name, kind: item.default_type })) ?? [],
        investmentFunds: investmentFunds.data?.map((item) => ({ id: item.id, name: item.name, kind: item.provider ?? undefined })) ?? [],
      };
      setCatalogs(nextCatalogs);
      setForm(createInitialState(nextCatalogs));
      setCatalogsLoaded(true);
    }

    function onOpen(event: Event) {
      const custom = event as CustomEvent<{ mode?: AddMovementMode }>;
      setMode(custom.detail?.mode ?? "card");
      setErrors({});
      setMoreOptions(false);
      setOpen(true);
      if (!catalogsLoaded) void loadCatalogs();
      else setForm(createInitialState(catalogs));
    }

    window.addEventListener("open-add-movement", onOpen);
    return () => window.removeEventListener("open-add-movement", onOpen);
  }, [catalogs, catalogsLoaded]);

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
    if (["card", "recurring", "installment", "other"].includes(mode) && !form.description.trim()) nextErrors.description = "Ingresa una descripcion.";
    if (["card", "other"].includes(mode)) {
      if (!positive(form.amount)) nextErrors.amount = "El importe debe ser mayor que cero.";
      if (!form.categoryId) nextErrors.categoryId = "Elegi una categoria.";
      if (!form.date) nextErrors.date = "Elegi una fecha valida.";
    }
    if (mode === "income") {
      if (!positive(form.amount)) nextErrors.amount = "El importe debe ser mayor que cero.";
      if (!form.date) nextErrors.date = "Elegi una fecha valida.";
    }
    if (mode === "recurring") {
      if (!positive(form.amount)) nextErrors.amount = "El importe debe ser mayor que cero.";
      if (!form.categoryId) nextErrors.categoryId = "Elegi una categoria.";
      if (!form.startMonth) nextErrors.startMonth = "Elegi el mes de inicio.";
    }
    if (mode === "installment") {
      if (!form.categoryId) nextErrors.categoryId = "Elegi una categoria.";
      if (!positive(form.totalAmount)) nextErrors.totalAmount = "El total debe ser mayor que cero.";
      if (!positive(form.installmentAmount)) nextErrors.installmentAmount = "El importe por cuota debe ser mayor que cero.";
      if (!positive(form.installmentCount)) nextErrors.installmentCount = "La cantidad de cuotas debe ser mayor que cero.";
      if (!positive(form.firstInstallment)) nextErrors.firstInstallment = "La primera cuota debe ser mayor que cero.";
      if (!form.startMonth) nextErrors.startMonth = "Elegi el mes de inicio.";
    }
    if (mode === "usd") {
      if (!positive(form.usdAmount)) nextErrors.usdAmount = "Ingresa los USD.";
      if (["usd_purchase", "fund_contribution"].includes(form.usdMovementType) && !positive(form.arsUsed)) nextErrors.arsUsed = "Ingresa los pesos utilizados.";
      if (!form.date) nextErrors.date = "Elegi una fecha valida.";
      if (form.usdMovementType === "fund_transfer") {
        if (!form.fromFundId) nextErrors.fromFundId = "Elegi origen.";
        if (!form.toFundId || form.toFundId === form.fromFundId) nextErrors.toFundId = "Elegi un destino distinto.";
      } else if (!form.fundId) nextErrors.fundId = "Elegi un fondo.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function resetAndClose() {
    setOpen(false);
    setForm(createInitialState(catalogs));
    setErrors({});
    setMoreOptions(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !validate()) return;
    const formData = new FormData();
    formData.set("mode", mode);
    Object.entries(form).forEach(([key, value]) => formData.set(key, value));
    startTransition(async () => {
      const result = await createFinanceEntry(formData);
      toast(result.message);
      if (result.ok) {
        resetAndClose();
        router.refresh();
        router.push(`/?month=${form.date.slice(0, 7)}`);
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 transition" aria-hidden={!open}>
      <button type="button" className="absolute inset-0 bg-stone-950/45" onClick={resetAndClose} aria-label="Cerrar formulario" />
      <aside
        className="absolute bottom-0 right-0 flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-stone-50 shadow-2xl md:bottom-auto md:top-0 md:h-full md:max-h-none md:max-w-xl md:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-movement-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Nuevo registro</p>
            <h2 id="add-movement-title" className="text-xl font-semibold text-stone-950">Agregar movimiento</h2>
          </div>
          <button type="button" onClick={resetAndClose} className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-100" aria-label="Cerrar">
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {!catalogsLoaded ? <p className="rounded-lg bg-white p-3 text-sm text-stone-600">Cargando catalogos...</p> : null}
            <SelectField id="movementType" label="Tipo de movimiento" value={mode} options={Object.entries(modeLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setMode(value as AddMovementMode); setErrors({}); setMoreOptions(false); }} />

            {mode !== "income" && mode !== "usd" ? <TextField id="description" label="Descripcion" value={form.description} error={errors.description} onChange={(value) => update("description", value)} /> : null}

            {mode === "card" ? (
              <>
                <MoneyField value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField id="category" label="Categoria" value={form.categoryId} error={errors.categoryId} options={[{ value: "", label: "Seleccionar" }, ...catalogs.categories.map((item) => ({ value: item.id, label: item.name }))]} onChange={(value) => update("categoryId", value)} />
                <DateField value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <MoreOptions open={moreOptions} onToggle={() => setMoreOptions((value) => !value)}>
                  <SelectField id="paymentMethod" label="Medio de pago" value={form.paymentMethodId} options={catalogs.paymentMethods.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("paymentMethodId", value)} />
                </MoreOptions>
              </>
            ) : null}

            {mode === "income" ? (
              <>
                <DateField label="Fecha de deposito" value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <MoneyField value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField id="source" label="Fuente" value={form.incomeSourceId} options={catalogs.incomeSources.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("incomeSourceId", value)} />
                <SelectField id="incomeType" label="Tipo de ingreso" value={form.incomeType} options={["Sueldo", "Honorarios", "Aguinaldo", "Reintegro", "Otro"].map((item) => ({ value: item, label: item }))} onChange={(value) => update("incomeType", value)} />
                <TextField id="note" label="Nota opcional" value={form.note} onChange={(value) => update("note", value)} />
              </>
            ) : null}

            {mode === "recurring" ? (
              <>
                <MoneyField label="Importe actual" value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField id="recurringCategory" label="Categoria" value={form.categoryId} error={errors.categoryId} options={[{ value: "", label: "Seleccionar" }, ...catalogs.categories.map((item) => ({ value: item.id, label: item.name }))]} onChange={(value) => update("categoryId", value)} />
                <MonthField value={form.startMonth} error={errors.startMonth} onChange={(value) => update("startMonth", value)} />
                <MoreOptions open={moreOptions} onToggle={() => setMoreOptions((value) => !value)}>
                  <SelectField id="recurringPayment" label="Medio de pago" value={form.paymentMethodId} options={catalogs.paymentMethods.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("paymentMethodId", value)} />
                  <MonthField id="endMonth" label="Finalizacion opcional" value={form.endMonth} onChange={(value) => update("endMonth", value)} />
                </MoreOptions>
              </>
            ) : null}

            {mode === "installment" ? (
              <>
                <SelectField id="installmentCategory" label="Categoria" value={form.categoryId} error={errors.categoryId} options={[{ value: "", label: "Seleccionar" }, ...catalogs.categories.map((item) => ({ value: item.id, label: item.name }))]} onChange={(value) => update("categoryId", value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <MoneyField id="totalAmount" label="Importe total" value={form.totalAmount} error={errors.totalAmount} onChange={(value) => update("totalAmount", value)} />
                  <MoneyField id="installmentAmount" label="Importe por cuota" value={form.installmentAmount} error={errors.installmentAmount} onChange={(value) => update("installmentAmount", value)} />
                  <NumberField id="installmentCount" label="Cantidad de cuotas" value={form.installmentCount} error={errors.installmentCount} onChange={(value) => update("installmentCount", value)} />
                  <NumberField id="firstInstallment" label="Primera cuota" value={form.firstInstallment} error={errors.firstInstallment} onChange={(value) => update("firstInstallment", value)} />
                </div>
                <DateField label="Fecha de compra" value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <MonthField value={form.startMonth} error={errors.startMonth} onChange={(value) => update("startMonth", value)} />
                <MoreOptions open={moreOptions} onToggle={() => setMoreOptions((value) => !value)}>
                  <SelectField id="installmentPayment" label="Medio de pago" value={form.paymentMethodId} options={catalogs.paymentMethods.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("paymentMethodId", value)} />
                </MoreOptions>
                {preview ? <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-950">{preview}</div> : null}
              </>
            ) : null}

            {mode === "usd" ? (
              <>
                <DateField value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
                <SelectField id="usdMovementType" label="Tipo de movimiento" value={form.usdMovementType} options={[
                  { value: "opening_balance", label: "Saldo inicial" },
                  { value: "fund_contribution", label: "Aporte" },
                  { value: "usd_purchase", label: "Compra USD" },
                  { value: "withdrawal", label: "Retiro" },
                  { value: "fund_transfer", label: "Transferencia" },
                  { value: "valuation_adjustment", label: "Ajuste de valuacion" },
                ]} onChange={(value) => update("usdMovementType", value)} />
                <NumberField id="usdAmount" label="USD" value={form.usdAmount} error={errors.usdAmount} onChange={(value) => update("usdAmount", value)} />
                {["usd_purchase", "fund_contribution"].includes(form.usdMovementType) ? <MoneyField id="arsUsed" label="Pesos utilizados" value={form.arsUsed} error={errors.arsUsed} onChange={(value) => update("arsUsed", value)} /> : null}
                <NumberField id="exchangeRate" label="Tipo de cambio" value={form.exchangeRate} onChange={(value) => update("exchangeRate", value)} />
                {form.usdMovementType === "fund_transfer" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField id="fromFund" label="Origen" value={form.fromFundId} error={errors.fromFundId} options={catalogs.investmentFunds.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("fromFundId", value)} />
                    <SelectField id="toFund" label="Destino" value={form.toFundId} error={errors.toFundId} options={catalogs.investmentFunds.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("toFundId", value)} />
                  </div>
                ) : (
                  <SelectField id="fund" label="Fondo o destino" value={form.fundId} error={errors.fundId} options={catalogs.investmentFunds.map((item) => ({ value: item.id, label: item.name }))} onChange={(value) => update("fundId", value)} />
                )}
              </>
            ) : null}

            {mode === "other" ? (
              <>
                <MoneyField value={form.amount} error={errors.amount} onChange={(value) => update("amount", value)} />
                <SelectField id="otherCategory" label="Categoria" value={form.categoryId} error={errors.categoryId} options={[{ value: "", label: "Seleccionar" }, ...catalogs.categories.map((item) => ({ value: item.id, label: item.name }))]} onChange={(value) => update("categoryId", value)} />
                <DateField value={form.date} error={errors.date} onChange={(value) => update("date", value)} />
              </>
            ) : null}
          </div>

          <div className="border-t border-stone-200 bg-white p-5">
            <button type="submit" disabled={isPending || !catalogsLoaded} className="flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? "Guardando..." : "Guardar movimiento"}
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
  return `mt-1 h-11 w-full rounded-lg border bg-white px-3 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 ${error ? "border-red-500" : "border-stone-300"}`;
}

function TextField({ id = "text", label = "Texto", value, error, onChange }: FieldProps) {
  return <label className="block text-sm font-medium text-stone-700" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} />{error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}</label>;
}

function MoneyField({ id = "amount", label = "Importe", value, error, onChange }: FieldProps) {
  return <label className="block text-sm font-medium text-stone-700" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} inputMode="decimal" type="number" min="0" step="0.01" />{error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}</label>;
}

function NumberField({ id, label, value, error, onChange }: FieldProps) {
  return <label className="block text-sm font-medium text-stone-700" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} inputMode="decimal" type="number" min="0" step="0.01" />{error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}</label>;
}

function DateField({ label = "Fecha", value, error, onChange }: FieldProps) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return <label className="block text-sm font-medium text-stone-700" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} type="date" />{error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}</label>;
}

function MonthField({ id = "startMonth", label = "Mes de inicio", value, error, onChange }: FieldProps) {
  return <label className="block text-sm font-medium text-stone-700" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)} type="month" />{error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}</label>;
}

type SelectOption = { value: string; label: string };
type SelectFieldProps = FieldProps & { options: SelectOption[] };

function SelectField({ id = "select", label = "Seleccionar", value, error, options, onChange }: SelectFieldProps) {
  return <label className="block text-sm font-medium text-stone-700" htmlFor={id}>{label}<select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass(error)}>{options.map((option) => <option key={option.value || "empty"} value={option.value}>{option.label}</option>)}</select>{error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}</label>;
}

function MoreOptions({ open, onToggle, children }: { open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <button type="button" onClick={onToggle} className="flex min-h-11 w-full items-center justify-between px-3 text-sm font-semibold text-stone-800">
        Mas opciones
        <span aria-hidden="true">{open ? "-" : "+"}</span>
      </button>
      {open ? <div className="space-y-4 border-t border-stone-200 p-3">{children}</div> : null}
    </div>
  );
}
