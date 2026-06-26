export type CatalogOption = {
  id: string;
  name: string;
  color?: string | null;
  kind?: string;
};

export type FinanceCatalogs = {
  categories: CatalogOption[];
  paymentMethods: CatalogOption[];
  incomeSources: CatalogOption[];
  investmentFunds: CatalogOption[];
};

export type FinanceMovement = {
  id: string;
  date: string;
  type: "income" | "expense" | "saving" | "transfer" | "adjustment" | "informational";
  nature: "variable" | "recurring_fixed" | "installment" | "investment" | "internal_transfer" | "other";
  status: "planned" | "confirmed" | "pending_review" | "canceled";
  amount: number;
  description: string;
  category: string;
  categoryId: string | null;
  paymentMethod: string;
  paymentMethodId: string | null;
};

export type MonthSummary = {
  income: number;
  fixed: number;
  installments: number;
  variable: number;
  savings: number;
  totalSpent: number;
  estimatedResult: number;
};

export type Commitment = {
  id: string;
  name: string;
  detail: string;
  month: string;
  amount: number;
};

export type CategoryTotal = {
  name: string;
  amount: number;
  color: string;
};

export type AnnualEvolutionItem = {
  month: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
};

export type PortfolioFund = {
  id: string;
  name: string;
  amount: number;
};

export type PortfolioMovement = {
  id: string;
  date: string;
  type: string;
  fund: string;
  usdAmount: number;
  arsAmount: number;
};

export type PortfolioSummary = {
  total: number;
  contributed: number;
  valuationChange: number;
  funds: PortfolioFund[];
  recentMovements: PortfolioMovement[];
};

export type FinancePageData = {
  selectedMonth: string;
  catalogs: FinanceCatalogs;
  movements: FinanceMovement[];
  latestMovements: FinanceMovement[];
  summary: MonthSummary;
  previousSummary: MonthSummary;
  commitments: Commitment[];
  categoryTotals: CategoryTotal[];
  topExpenses: FinanceMovement[];
  annualEvolution: AnnualEvolutionItem[];
  portfolio: PortfolioSummary;
};
