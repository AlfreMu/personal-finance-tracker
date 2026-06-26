"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FinanceActionResult = {
  ok: boolean;
  message: string;
};

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error("Faltan campos obligatorios.");
  return value;
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function positiveNumber(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value <= 0) throw new Error("Los importes deben ser mayores que cero.");
  return value;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = optionalString(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Los importes deben ser mayores que cero.");
  return value;
}

function monthDate(value: string) {
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
}

async function currentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Necesitas iniciar sesion.");
  return { supabase, userId: data.user.id };
}

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/movimientos");
  revalidatePath("/estadisticas");
  revalidatePath("/ahorros");
}

function success(message: string): FinanceActionResult {
  revalidateFinance();
  return { ok: true, message };
}

export async function createFinanceEntry(formData: FormData): Promise<FinanceActionResult> {
  try {
    const { supabase, userId } = await currentUserId();
    const mode = requiredString(formData, "mode");

    if (mode === "card" || mode === "other") {
      const { error } = await supabase.from("movements").insert({
        user_id: userId,
        occurred_on: requiredString(formData, "date"),
        type: mode === "card" ? "expense" : "informational",
        nature: mode === "card" ? "variable" : "other",
        status: "confirmed",
        amount: positiveNumber(formData, "amount"),
        currency: "ARS",
        description: requiredString(formData, "description"),
        category_id: optionalString(formData, "categoryId"),
        payment_method_id: optionalString(formData, "paymentMethodId"),
      });
      if (error) throw error;
    }

    if (mode === "income") {
      const { error } = await supabase.from("movements").insert({
        user_id: userId,
        occurred_on: requiredString(formData, "date"),
        type: "income",
        nature: "other",
        status: "confirmed",
        amount: positiveNumber(formData, "amount"),
        currency: "ARS",
        description: optionalString(formData, "note") ?? "Ingreso",
        income_source_id: optionalString(formData, "incomeSourceId"),
        note: optionalString(formData, "incomeType"),
      });
      if (error) throw error;
    }

    if (mode === "recurring") {
      const { error } = await supabase.rpc("create_recurring_expense", {
        p_description: requiredString(formData, "description"),
        p_category_id: optionalString(formData, "categoryId"),
        p_payment_method_id: optionalString(formData, "paymentMethodId"),
        p_amount: positiveNumber(formData, "amount"),
        p_currency: "ARS",
        p_start_month: `${requiredString(formData, "startMonth")}-01`,
        p_end_month: optionalString(formData, "endMonth") ? `${optionalString(formData, "endMonth")}-01` : null,
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    if (mode === "installment") {
      const { error } = await supabase.rpc("create_installment_purchase", {
        p_description: requiredString(formData, "description"),
        p_category_id: optionalString(formData, "categoryId"),
        p_payment_method_id: optionalString(formData, "paymentMethodId"),
        p_purchase_date: requiredString(formData, "date"),
        p_first_period_month: `${requiredString(formData, "startMonth")}-01`,
        p_total_amount: positiveNumber(formData, "totalAmount"),
        p_installment_amount: positiveNumber(formData, "installmentAmount"),
        p_installment_count: Number(requiredString(formData, "installmentCount")),
        p_first_installment_number: Number(requiredString(formData, "firstInstallment")),
        p_currency: "ARS",
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    if (mode === "usd") {
      const type = requiredString(formData, "usdMovementType");
      const isTransfer = type === "fund_transfer";
      const isContribution = type === "usd_purchase" || type === "fund_contribution";
      const { error } = await supabase.rpc("create_investment_activity", {
        p_occurred_on: requiredString(formData, "date"),
        p_type: type,
        p_fund_id: isTransfer ? null : requiredString(formData, "fundId"),
        p_from_fund_id: isTransfer ? requiredString(formData, "fromFundId") : null,
        p_to_fund_id: isTransfer ? requiredString(formData, "toFundId") : null,
        p_usd_amount: positiveNumber(formData, "usdAmount"),
        p_ars_amount: isContribution ? positiveNumber(formData, "arsUsed") : null,
        p_exchange_rate: optionalString(formData, "exchangeRate") ? Number(optionalString(formData, "exchangeRate")) : null,
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    return success("Movimiento guardado en Supabase.");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo guardar el movimiento." };
  }
}

export async function updateFinanceEntry(formData: FormData): Promise<FinanceActionResult> {
  try {
    const { supabase } = await currentUserId();
    const sourceKind = requiredString(formData, "sourceKind");

    if (sourceKind === "simple") {
      const { error } = await supabase.rpc("update_simple_movement", {
        p_movement_id: requiredString(formData, "sourceId"),
        p_occurred_on: requiredString(formData, "date"),
        p_amount: positiveNumber(formData, "amount"),
        p_description: requiredString(formData, "description"),
        p_category_id: optionalString(formData, "categoryId"),
        p_payment_method_id: optionalString(formData, "paymentMethodId"),
        p_income_source_id: optionalString(formData, "incomeSourceId"),
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    if (sourceKind === "installment") {
      const { error } = await supabase.rpc("update_installment_instance", {
        p_installment_id: requiredString(formData, "sourceId"),
        p_scope: requiredString(formData, "scope"),
        p_period_month: monthDate(requiredString(formData, "date")),
        p_amount: positiveNumber(formData, "amount"),
        p_description: requiredString(formData, "description"),
        p_category_id: optionalString(formData, "categoryId"),
        p_payment_method_id: optionalString(formData, "paymentMethodId"),
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    if (sourceKind === "recurring") {
      const { error } = await supabase.rpc("update_recurring_instance", {
        p_recurring_instance_id: requiredString(formData, "sourceId"),
        p_scope: requiredString(formData, "scope"),
        p_period_month: monthDate(requiredString(formData, "date")),
        p_amount: positiveNumber(formData, "amount"),
        p_description: requiredString(formData, "description"),
        p_category_id: optionalString(formData, "categoryId"),
        p_payment_method_id: optionalString(formData, "paymentMethodId"),
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    if (sourceKind === "investment") {
      const type = requiredString(formData, "investmentType");
      const isTransfer = type === "fund_transfer";
      const isContribution = type === "usd_purchase" || type === "fund_contribution";
      const { error } = await supabase.rpc("update_investment_activity", {
        p_investment_movement_id: requiredString(formData, "sourceId"),
        p_occurred_on: requiredString(formData, "date"),
        p_type: type,
        p_fund_id: isTransfer ? null : requiredString(formData, "fundId"),
        p_from_fund_id: isTransfer ? requiredString(formData, "fromFundId") : null,
        p_to_fund_id: isTransfer ? requiredString(formData, "toFundId") : null,
        p_usd_amount: positiveNumber(formData, "usdAmount"),
        p_ars_amount: isContribution ? positiveNumber(formData, "arsUsed") : null,
        p_exchange_rate: optionalNumber(formData, "exchangeRate"),
        p_note: optionalString(formData, "note"),
      });
      if (error) throw error;
    }

    return success("Cambios guardados.");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo editar el movimiento." };
  }
}

export async function deleteFinanceEntry(formData: FormData): Promise<FinanceActionResult> {
  try {
    const { supabase } = await currentUserId();
    const sourceKind = requiredString(formData, "sourceKind");

    if (sourceKind === "simple") {
      const { error } = await supabase.rpc("delete_simple_movement", {
        p_movement_id: requiredString(formData, "sourceId"),
      });
      if (error) throw error;
    } else if (sourceKind === "investment") {
      const { error } = await supabase.rpc("delete_investment_activity", {
        p_investment_movement_id: requiredString(formData, "sourceId"),
      });
      if (error) throw error;
    } else {
      throw new Error("Esta fila conserva historial y no se elimina directamente.");
    }

    return success("Movimiento eliminado.");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo eliminar el movimiento." };
  }
}

export async function cancelInstallmentPurchaseAction(formData: FormData): Promise<FinanceActionResult> {
  try {
    const { supabase } = await currentUserId();
    const { error } = await supabase.rpc("cancel_installment_purchase_from", {
      p_installment_purchase_id: requiredString(formData, "parentId"),
    });
    if (error) throw error;
    return success("Compra cancelada. Las cuotas confirmadas se conservaron.");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo cancelar la compra." };
  }
}

export async function deactivateRecurringRuleAction(formData: FormData): Promise<FinanceActionResult> {
  try {
    const { supabase } = await currentUserId();
    const { error } = await supabase.rpc("deactivate_recurring_rule_from", {
      p_recurring_rule_id: requiredString(formData, "parentId"),
      p_from_month: monthDate(requiredString(formData, "fromMonth")),
    });
    if (error) throw error;
    return success("Recurrencia desactivada. El historial se conservo.");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo desactivar la recurrencia." };
  }
}
