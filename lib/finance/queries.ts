import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addMonths, formatMonthLabel, monthAfter, monthStart, normalizeMonth } from "./date";
import type {
  AnnualEvolutionItem,
  CategoryTotal,
  Commitment,
  FinanceCatalogs,
  FinanceMovement,
  FinancePageData,
  MonthSummary,
  PortfolioSummary,
} from "./types";

type RawMovement = {
  id: string;
  occurred_on: string;
  type: FinanceMovement["type"];
  nature: FinanceMovement["nature"];
  status: FinanceMovement["status"];
  amount: number;
  description: string;
  category_id: string | null;
  payment_method_id: string | null;
};

type InvestmentMovementRow = {
  id: string;
  occurred_on: string;
  type: string;
  fund_id: string | null;
  from_fund_id: string | null;
  to_fund_id: string | null;
  usd_amount: number | null;
  ars_amount: number | null;
  status: string;
};

type RecurringCommitmentRow = {
  id: string;
  period_month: string;
  planned_amount: number;
  recurring_rules: { description: string } | { description: string }[] | null;
};

type InstallmentCommitmentRow = {
  id: string;
  period_month: string;
  installment_number: number;
  amount: number;
  installment_purchases: { description: string; installment_count: number } | { description: string; installment_count: number }[] | null;
};

const emptySummary: MonthSummary = {
  income: 0,
  fixed: 0,
  installments: 0,
  variable: 0,
  savings: 0,
  totalSpent: 0,
  estimatedResult: 0,
};

export async function getFinancePageData(monthParam?: string | null): Promise<FinancePageData> {
  const selectedMonth = normalizeMonth(monthParam);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const [
    categoriesResult,
    paymentMethodsResult,
    incomeSourcesResult,
    investmentFundsResult,
    movementsResult,
    recurringResult,
    installmentsResult,
    investmentMovementsResult,
  ] = await Promise.all([
    supabase.from("categories").select("id,name,color,scope,sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("payment_methods").select("id,name,kind,is_default").eq("is_active", true).order("is_default", { ascending: false }).order("name"),
    supabase.from("income_sources").select("id,name,default_type").eq("is_active", true).order("name"),
    supabase.from("investment_funds").select("id,name,provider").eq("is_active", true).order("name"),
    supabase
      .from("movements")
      .select("id,occurred_on,type,nature,status,amount,description,category_id,payment_method_id")
      .gte("occurred_on", `${selectedMonth.slice(0, 4)}-01-01`)
      .lt("occurred_on", `${Number(selectedMonth.slice(0, 4)) + 1}-01-01`)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("recurring_instances")
      .select("id,period_month,planned_amount,status,recurring_rules(description)")
      .gte("period_month", monthStart(selectedMonth))
      .lt("period_month", monthStart(addMonths(selectedMonth, 4)))
      .eq("status", "planned")
      .order("period_month"),
    supabase
      .from("installments")
      .select("id,period_month,installment_number,amount,status,installment_purchases(description,installment_count)")
      .gte("period_month", monthStart(selectedMonth))
      .lt("period_month", monthStart(addMonths(selectedMonth, 4)))
      .eq("status", "planned")
      .order("period_month"),
    supabase
      .from("investment_movements")
      .select("id,occurred_on,type,fund_id,from_fund_id,to_fund_id,usd_amount,ars_amount,status")
      .order("occurred_on", { ascending: false })
      .limit(1000),
  ]);

  for (const result of [
    categoriesResult,
    paymentMethodsResult,
    incomeSourcesResult,
    investmentFundsResult,
    movementsResult,
    recurringResult,
    installmentsResult,
    investmentMovementsResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const categories = categoriesResult.data ?? [];
  const paymentMethods = paymentMethodsResult.data ?? [];
  const funds = investmentFundsResult.data ?? [];
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const paymentById = new Map(paymentMethods.map((item) => [item.id, item]));
  const fundById = new Map(funds.map((item) => [item.id, item.name]));
  const allMovements = ((movementsResult.data ?? []) as RawMovement[]).map((movement) =>
    mapMovement(movement, categoryById, paymentById),
  );
  const movements = allMovements.filter((movement) => movement.date >= monthStart(selectedMonth) && movement.date < monthAfter(selectedMonth));
  const previousMovements = allMovements.filter((movement) => movement.date >= monthStart(addMonths(selectedMonth, -1)) && movement.date < monthStart(selectedMonth));

  const summary = summarize(movements);
  const previousSummary = summarize(previousMovements);
  const latestMovements = movements.slice(0, 5);
  const commitments = [
    ...((recurringResult.data ?? []) as unknown as RecurringCommitmentRow[]).map(mapRecurringCommitment),
    ...((installmentsResult.data ?? []) as unknown as InstallmentCommitmentRow[]).map(mapInstallmentCommitment),
  ].sort((a, b) => a.month.localeCompare(b.month)).slice(0, 6);

  const categoryTotals = getCategoryTotals(movements, categoryById);
  const topExpenses = movements
    .filter((movement) => movement.type === "expense" && movement.status === "confirmed")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const annualEvolution = buildAnnualEvolution(allMovements, selectedMonth);
  const portfolio = buildPortfolio((investmentMovementsResult.data ?? []) as InvestmentMovementRow[], fundById);

  const catalogs: FinanceCatalogs = {
    categories: categories.map((item) => ({ id: item.id, name: item.name, color: item.color })),
    paymentMethods: paymentMethods.map((item) => ({ id: item.id, name: item.name, kind: item.kind })),
    incomeSources: (incomeSourcesResult.data ?? []).map((item) => ({ id: item.id, name: item.name, kind: item.default_type })),
    investmentFunds: funds.map((item) => ({ id: item.id, name: item.name, kind: item.provider ?? undefined })),
  };

  return {
    selectedMonth,
    catalogs,
    movements,
    latestMovements,
    summary,
    previousSummary,
    commitments,
    categoryTotals,
    topExpenses,
    annualEvolution,
    portfolio,
  };
}

function mapMovement(
  movement: RawMovement,
  categoryById: Map<string, { name: string }>,
  paymentById: Map<string, { name: string }>,
): FinanceMovement {
  return {
    id: movement.id,
    date: movement.occurred_on,
    type: movement.type,
    nature: movement.nature,
    status: movement.status,
    amount: Number(movement.amount),
    description: movement.description,
    category: movement.category_id ? categoryById.get(movement.category_id)?.name ?? "Sin categoria" : "Sin categoria",
    categoryId: movement.category_id,
    paymentMethod: movement.payment_method_id ? paymentById.get(movement.payment_method_id)?.name ?? "Sin medio" : "Sin medio",
    paymentMethodId: movement.payment_method_id,
  };
}

function summarize(movements: FinanceMovement[]): MonthSummary {
  return movements.reduce((summary, movement) => {
    if (movement.status !== "confirmed") return summary;
    if (movement.type === "income") summary.income += movement.amount;
    if (movement.type === "saving") summary.savings += movement.amount;
    if (movement.type === "expense") {
      if (movement.nature === "recurring_fixed") summary.fixed += movement.amount;
      else if (movement.nature === "installment") summary.installments += movement.amount;
      else summary.variable += movement.amount;
    }
    summary.totalSpent = summary.fixed + summary.installments + summary.variable;
    summary.estimatedResult = summary.income - summary.totalSpent - summary.savings;
    return summary;
  }, { ...emptySummary });
}

function getCategoryTotals(movements: FinanceMovement[], categoryById: Map<string, { name: string; color: string | null }>) {
  const totals = new Map<string, CategoryTotal>();
  for (const movement of movements) {
    if (movement.type !== "expense" || movement.status !== "confirmed") continue;
    const category = movement.categoryId ? categoryById.get(movement.categoryId) : undefined;
    const name = category?.name ?? movement.category;
    const current = totals.get(name) ?? { name, amount: 0, color: category?.color ?? "bg-stone-500" };
    current.amount += movement.amount;
    totals.set(name, current);
  }
  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

function buildAnnualEvolution(movements: FinanceMovement[], selectedMonth: string): AnnualEvolutionItem[] {
  const start = `${selectedMonth.slice(0, 4)}-01`;
  return Array.from({ length: 12 }, (_, index) => {
    const month = addMonths(start, index);
    const summary = summarize(movements.filter((movement) => movement.date >= monthStart(month) && movement.date < monthAfter(month)));
    return { month, label: formatMonthLabel(month), income: summary.income, expenses: summary.totalSpent, savings: summary.savings };
  }).filter((item) => item.income > 0 || item.expenses > 0 || item.savings > 0);
}

function buildPortfolio(rows: InvestmentMovementRow[], fundById: Map<string, string>): PortfolioSummary {
  const balances = new Map<string, number>();
  let contributed = 0;
  let valuationChange = 0;
  const confirmed = rows.filter((row) => row.status === "confirmed");

  for (const row of confirmed) {
    const usd = Number(row.usd_amount ?? 0);
    if (["opening_balance", "usd_purchase", "fund_contribution"].includes(row.type)) {
      if (!row.fund_id) continue;
      balances.set(row.fund_id, (balances.get(row.fund_id) ?? 0) + usd);
      contributed += usd;
    } else if (row.type === "withdrawal") {
      if (!row.fund_id) continue;
      balances.set(row.fund_id, (balances.get(row.fund_id) ?? 0) - usd);
      contributed -= usd;
    } else if (row.type === "valuation_adjustment") {
      if (!row.fund_id) continue;
      balances.set(row.fund_id, (balances.get(row.fund_id) ?? 0) + usd);
      valuationChange += usd;
    } else if (row.type === "fund_transfer") {
      if (!row.from_fund_id || !row.to_fund_id) continue;
      balances.set(row.from_fund_id, (balances.get(row.from_fund_id) ?? 0) - usd);
      balances.set(row.to_fund_id, (balances.get(row.to_fund_id) ?? 0) + usd);
    }
  }

  const funds = Array.from(balances.entries())
    .filter(([, amount]) => amount !== 0)
    .map(([id, amount]) => ({ id, name: fundById.get(id) ?? "Fondo sin nombre", amount }))
    .sort((a, b) => b.amount - a.amount);
  const recentMovements = confirmed.slice(0, 6).map((row) => ({
    id: row.id,
    date: row.occurred_on,
    type: row.type,
    fund: row.type === "fund_transfer"
      ? `${fundById.get(row.from_fund_id ?? "") ?? "Origen"} -> ${fundById.get(row.to_fund_id ?? "") ?? "Destino"}`
      : fundById.get(row.fund_id ?? "") ?? "Fondo sin nombre",
    usdAmount: Number(row.usd_amount ?? 0),
    arsAmount: Number(row.ars_amount ?? 0),
  }));

  return {
    total: funds.reduce((sum, fund) => sum + fund.amount, 0),
    contributed,
    valuationChange,
    funds,
    recentMovements,
  };
}

function mapRecurringCommitment(row: RecurringCommitmentRow): Commitment {
  const month = String(row.period_month).slice(0, 7);
  const rule = Array.isArray(row.recurring_rules) ? row.recurring_rules[0] : row.recurring_rules;
  return {
    id: row.id,
    name: rule?.description ?? "Gasto fijo",
    detail: "Gasto fijo planificado",
    month: formatMonthLabel(month),
    amount: Number(row.planned_amount),
  };
}

function mapInstallmentCommitment(row: InstallmentCommitmentRow): Commitment {
  const month = String(row.period_month).slice(0, 7);
  const purchase = Array.isArray(row.installment_purchases) ? row.installment_purchases[0] : row.installment_purchases;
  return {
    id: row.id,
    name: purchase?.description ?? "Compra en cuotas",
    detail: `Cuota ${row.installment_number} de ${purchase?.installment_count ?? "?"}`,
    month: formatMonthLabel(month),
    amount: Number(row.amount),
  };
}
