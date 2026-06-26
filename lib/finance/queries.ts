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
  income_source_id: string | null;
  note: string | null;
};

type InvestmentMovementRow = {
  id: string;
  occurred_on: string;
  type: string;
  fund_id: string | null;
  from_fund_id: string | null;
  to_fund_id: string | null;
  movement_id: string | null;
  usd_amount: number | null;
  ars_amount: number | null;
  exchange_rate: number | null;
  status: string;
  note: string | null;
};

type RecurringCommitmentRow = {
  id: string;
  period_month: string;
  planned_amount: number;
  status?: string;
  movement_id?: string | null;
  recurring_rule_id?: string;
  recurring_rules: { id?: string; description: string; category_id?: string | null; payment_method_id?: string | null; note?: string | null } | { id?: string; description: string; category_id?: string | null; payment_method_id?: string | null; note?: string | null }[] | null;
};

type InstallmentCommitmentRow = {
  id: string;
  period_month: string;
  installment_number: number;
  amount: number;
  status?: string;
  movement_id?: string | null;
  installment_purchase_id?: string;
  installment_purchases: { id?: string; description: string; category_id?: string | null; payment_method_id?: string | null; installment_count: number; note?: string | null } | { id?: string; description: string; category_id?: string | null; payment_method_id?: string | null; installment_count: number; note?: string | null }[] | null;
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
    recurringSourcesResult,
    installmentSourcesResult,
    investmentMovementsResult,
  ] = await Promise.all([
    supabase.from("categories").select("id,name,color,scope,sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("payment_methods").select("id,name,kind,is_default").eq("is_active", true).order("is_default", { ascending: false }).order("name"),
    supabase.from("income_sources").select("id,name,default_type").eq("is_active", true).order("name"),
    supabase.from("investment_funds").select("id,name,provider").eq("is_active", true).order("name"),
    supabase
      .from("movements")
      .select("id,occurred_on,type,nature,status,amount,description,category_id,payment_method_id,income_source_id,note")
      .gte("occurred_on", `${selectedMonth.slice(0, 4)}-01-01`)
      .lt("occurred_on", `${Number(selectedMonth.slice(0, 4)) + 1}-01-01`)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("recurring_instances")
      .select("id,period_month,planned_amount,status,movement_id,recurring_rule_id,recurring_rules(id,description,category_id,payment_method_id,note)")
      .gte("period_month", monthStart(selectedMonth))
      .lt("period_month", monthStart(addMonths(selectedMonth, 4)))
      .eq("status", "planned")
      .order("period_month"),
    supabase
      .from("installments")
      .select("id,period_month,installment_number,amount,status,movement_id,installment_purchase_id,installment_purchases(id,description,category_id,payment_method_id,installment_count,note)")
      .gte("period_month", monthStart(selectedMonth))
      .lt("period_month", monthStart(addMonths(selectedMonth, 4)))
      .eq("status", "planned")
      .order("period_month"),
    supabase
      .from("recurring_instances")
      .select("id,period_month,planned_amount,status,movement_id,recurring_rule_id,recurring_rules(id,description,category_id,payment_method_id,note)")
      .gte("period_month", `${selectedMonth.slice(0, 4)}-01-01`)
      .lt("period_month", `${Number(selectedMonth.slice(0, 4)) + 1}-01-01`)
      .order("period_month"),
    supabase
      .from("installments")
      .select("id,period_month,installment_number,amount,status,movement_id,installment_purchase_id,installment_purchases(id,description,category_id,payment_method_id,installment_count,note)")
      .gte("period_month", `${selectedMonth.slice(0, 4)}-01-01`)
      .lt("period_month", `${Number(selectedMonth.slice(0, 4)) + 1}-01-01`)
      .order("period_month"),
    supabase
      .from("investment_movements")
      .select("id,occurred_on,type,fund_id,from_fund_id,to_fund_id,movement_id,usd_amount,ars_amount,exchange_rate,status,note")
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
    recurringSourcesResult,
    installmentSourcesResult,
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
  const recurringSources = (recurringSourcesResult.data ?? []) as unknown as RecurringCommitmentRow[];
  const installmentSources = (installmentSourcesResult.data ?? []) as unknown as InstallmentCommitmentRow[];
  const investmentSources = (investmentMovementsResult.data ?? []) as InvestmentMovementRow[];
  const recurringByMovementId = new Map(recurringSources.filter((item) => item.movement_id).map((item) => [item.movement_id as string, item]));
  const installmentByMovementId = new Map(installmentSources.filter((item) => item.movement_id).map((item) => [item.movement_id as string, item]));
  const investmentByMovementId = new Map(investmentSources.filter((item) => item.movement_id).map((item) => [item.movement_id as string, item]));
  const allMovements = ((movementsResult.data ?? []) as RawMovement[]).map((movement) =>
    mapMovement(movement, categoryById, paymentById, {
      recurring: recurringByMovementId.get(movement.id),
      installment: installmentByMovementId.get(movement.id),
      investment: investmentByMovementId.get(movement.id),
    }),
  );
  const plannedRows = [
    ...installmentSources
      .filter((item) => !item.movement_id && item.status === "planned" && String(item.period_month).slice(0, 7) === selectedMonth)
      .map((item) => mapPlannedInstallment(item, categoryById, paymentById)),
    ...recurringSources
      .filter((item) => !item.movement_id && item.status === "planned" && String(item.period_month).slice(0, 7) === selectedMonth)
      .map((item) => mapPlannedRecurring(item, categoryById, paymentById)),
  ];
  const movements = [
    ...allMovements.filter((movement) => movement.date >= monthStart(selectedMonth) && movement.date < monthAfter(selectedMonth)),
    ...plannedRows,
  ].sort((a, b) => b.date.localeCompare(a.date));
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
  const portfolio = buildPortfolio(investmentSources, fundById);

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
  sources: {
    recurring?: RecurringCommitmentRow;
    installment?: InstallmentCommitmentRow;
    investment?: InvestmentMovementRow;
  },
): FinanceMovement {
  const source = movementSource(movement, sources);
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
    incomeSourceId: movement.income_source_id,
    note: movement.note,
    source,
  };
}

function movementSource(
  movement: RawMovement,
  sources: { recurring?: RecurringCommitmentRow; installment?: InstallmentCommitmentRow; investment?: InvestmentMovementRow },
): FinanceMovement["source"] {
  if (sources.installment) {
    const purchase = one(sources.installment.installment_purchases);
    return {
      kind: "installment",
      id: sources.installment.id,
      parentId: purchase?.id ?? sources.installment.installment_purchase_id,
      status: sources.installment.status,
      canEdit: true,
      canDelete: false,
      canCancelSeries: true,
      scopeLabel: sources.installment.status === "confirmed" ? "Solo esta cuota confirmada" : "Esta cuota o futuras",
    };
  }
  if (sources.recurring) {
    const rule = one(sources.recurring.recurring_rules);
    return {
      kind: "recurring",
      id: sources.recurring.id,
      parentId: rule?.id ?? sources.recurring.recurring_rule_id,
      status: sources.recurring.status,
      canEdit: true,
      canDelete: false,
      canCancelSeries: true,
      scopeLabel: sources.recurring.status === "confirmed" ? "Solo esta instancia confirmada" : "Esta instancia o futuras",
    };
  }
  if (sources.investment) {
    return {
      kind: "investment",
      id: sources.investment.id,
      status: sources.investment.status,
      canEdit: true,
      canDelete: true,
    };
  }
  return { kind: "simple", id: movement.id, status: movement.status, canEdit: true, canDelete: true };
}

function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function mapPlannedInstallment(
  row: InstallmentCommitmentRow,
  categoryById: Map<string, { name: string }>,
  paymentById: Map<string, { name: string }>,
): FinanceMovement {
  const purchase = one(row.installment_purchases);
  const categoryId = purchase?.category_id ?? null;
  const paymentMethodId = purchase?.payment_method_id ?? null;
  return {
    id: row.id,
    date: row.period_month,
    type: "expense",
    nature: "installment",
    status: "planned",
    amount: Number(row.amount),
    description: `${purchase?.description ?? "Compra en cuotas"} - cuota ${row.installment_number} de ${purchase?.installment_count ?? "?"}`,
    category: categoryId ? categoryById.get(categoryId)?.name ?? "Sin categoria" : "Sin categoria",
    categoryId,
    paymentMethod: paymentMethodId ? paymentById.get(paymentMethodId)?.name ?? "Sin medio" : "Sin medio",
    paymentMethodId,
    incomeSourceId: null,
    note: purchase?.note ?? null,
    source: {
      kind: "installment",
      id: row.id,
      parentId: purchase?.id ?? row.installment_purchase_id,
      status: row.status,
      canEdit: true,
      canDelete: false,
      canCancelSeries: true,
      scopeLabel: "Esta cuota o futuras",
    },
  };
}

function mapPlannedRecurring(
  row: RecurringCommitmentRow,
  categoryById: Map<string, { name: string }>,
  paymentById: Map<string, { name: string }>,
): FinanceMovement {
  const rule = one(row.recurring_rules);
  const categoryId = rule?.category_id ?? null;
  const paymentMethodId = rule?.payment_method_id ?? null;
  return {
    id: row.id,
    date: row.period_month,
    type: "expense",
    nature: "recurring_fixed",
    status: "planned",
    amount: Number(row.planned_amount),
    description: rule?.description ?? "Gasto fijo",
    category: categoryId ? categoryById.get(categoryId)?.name ?? "Sin categoria" : "Sin categoria",
    categoryId,
    paymentMethod: paymentMethodId ? paymentById.get(paymentMethodId)?.name ?? "Sin medio" : "Sin medio",
    paymentMethodId,
    incomeSourceId: null,
    note: rule?.note ?? null,
    source: {
      kind: "recurring",
      id: row.id,
      parentId: rule?.id ?? row.recurring_rule_id,
      status: row.status,
      canEdit: true,
      canDelete: false,
      canCancelSeries: true,
      scopeLabel: "Esta instancia o futuras",
    },
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
    fundId: row.fund_id,
    fromFundId: row.from_fund_id,
    toFundId: row.to_fund_id,
    fund: row.type === "fund_transfer"
      ? `${fundById.get(row.from_fund_id ?? "") ?? "Origen"} -> ${fundById.get(row.to_fund_id ?? "") ?? "Destino"}`
      : fundById.get(row.fund_id ?? "") ?? "Fondo sin nombre",
    usdAmount: Number(row.usd_amount ?? 0),
    arsAmount: Number(row.ars_amount ?? 0),
    exchangeRate: row.exchange_rate === null ? null : Number(row.exchange_rate),
    note: row.note,
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
