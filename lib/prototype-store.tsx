"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type {
  Installment,
  InstallmentPurchase,
  Movement,
  PrototypeState,
  RecurringRule,
  SavingsMovement,
  SavingsMovementType,
} from "./mock-data";
import { initialState } from "./mock-data";

type AddCardInput = {
  description: string;
  amount: number;
  category: string;
  date: string;
};

type AddIncomeInput = {
  amount: number;
  date: string;
  source: string;
  incomeType: string;
  note?: string;
};

type AddRecurringInput = {
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  startMonth: string;
  endDate?: string;
};

type AddInstallmentInput = {
  description: string;
  category: string;
  totalAmount: number;
  installmentAmount: number;
  installmentCount: number;
  firstInstallment: number;
  startMonth: string;
  paymentMethod: string;
};

type AddSavingsInput = {
  date: string;
  type: SavingsMovementType;
  usdAmount: number;
  arsAmount: number;
  exchangeRate?: number;
  fund: string;
};

type AddOtherInput = {
  description: string;
  amount: number;
  category: string;
  date: string;
};

type Action =
  | { type: "SET_MONTH"; month: string }
  | { type: "SET_TOAST"; message?: string }
  | { type: "ADD_CARD"; input: AddCardInput }
  | { type: "ADD_INCOME"; input: AddIncomeInput }
  | { type: "ADD_RECURRING"; input: AddRecurringInput }
  | { type: "ADD_INSTALLMENT"; input: AddInstallmentInput }
  | { type: "ADD_SAVINGS"; input: AddSavingsInput }
  | { type: "ADD_OTHER"; input: AddOtherInput };

type PrototypeContextValue = {
  state: PrototypeState;
  dispatch: React.Dispatch<Action>;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function monthOf(date: string) {
  return date.slice(0, 7);
}

function dateFromMonth(month: string, day = 5) {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function addMonths(month: string, offset: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + offset, 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function reducer(state: PrototypeState, action: Action): PrototypeState {
  if (action.type === "SET_MONTH") {
    return { ...state, selectedMonth: action.month };
  }

  if (action.type === "SET_TOAST") {
    return { ...state, toast: action.message };
  }

  if (action.type === "ADD_CARD") {
    const movement: Movement = {
      id: id("mov"),
      description: action.input.description,
      date: action.input.date,
      category: action.input.category,
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "variable",
      amount: action.input.amount,
      status: "confirmado",
    };

    return {
      ...state,
      selectedMonth: monthOf(action.input.date),
      movements: [movement, ...state.movements],
      toast: "Movimiento agregado correctamente",
    };
  }

  if (action.type === "ADD_INCOME") {
    const movement: Movement = {
      id: id("mov"),
      description: `${action.input.incomeType} - ${action.input.source}`,
      date: action.input.date,
      category: "Ingreso",
      paymentMethod: "ICBC pesos",
      type: "ingreso",
      nature: "ingreso",
      amount: action.input.amount,
      status: "confirmado",
      note: action.input.note,
    };

    return {
      ...state,
      selectedMonth: monthOf(action.input.date),
      movements: [movement, ...state.movements],
      toast: "Movimiento agregado correctamente",
    };
  }

  if (action.type === "ADD_RECURRING") {
    const ruleId = id("rec");
    const movementId = id("mov");
    const rule: RecurringRule = {
      id: ruleId,
      description: action.input.description,
      category: action.input.category,
      amount: action.input.amount,
      paymentMethod: action.input.paymentMethod,
      startMonth: action.input.startMonth,
      endMonth: action.input.endDate ? monthOf(action.input.endDate) : undefined,
    };
    const movement: Movement = {
      id: movementId,
      description: action.input.description,
      date: dateFromMonth(action.input.startMonth),
      category: action.input.category,
      paymentMethod: action.input.paymentMethod,
      type: "gasto",
      nature: "fijo",
      amount: action.input.amount,
      status: "confirmado",
      recurringRuleId: ruleId,
    };

    return {
      ...state,
      selectedMonth: action.input.startMonth,
      recurringRules: [rule, ...state.recurringRules],
      movements: [movement, ...state.movements],
      toast: "Movimiento agregado correctamente",
    };
  }

  if (action.type === "ADD_INSTALLMENT") {
    const purchaseId = id("purchase");
    const endMonth = addMonths(action.input.startMonth, action.input.installmentCount - 1);
    const purchase: InstallmentPurchase = {
      id: purchaseId,
      description: action.input.description,
      category: action.input.category,
      totalAmount: action.input.totalAmount,
      installmentAmount: action.input.installmentAmount,
      installmentCount: action.input.installmentCount,
      startMonth: action.input.startMonth,
      paymentMethod: action.input.paymentMethod,
      endMonth,
    };

    const createdInstallments: Installment[] = [];
    const createdMovements: Movement[] = [];

    for (let index = 0; index < action.input.installmentCount; index += 1) {
      const installmentNumber = action.input.firstInstallment + index;
      const month = addMonths(action.input.startMonth, index);
      const installmentId = id("inst");
      const movementId = id("mov");
      const status = index === 0 ? "confirmado" : "planificado";

      createdInstallments.push({
        id: installmentId,
        purchaseId,
        number: installmentNumber,
        total: action.input.installmentCount,
        amount: action.input.installmentAmount,
        month,
        status,
        movementId,
      });

      createdMovements.push({
        id: movementId,
        description: `${action.input.description} - cuota ${installmentNumber} de ${action.input.installmentCount}`,
        date: dateFromMonth(month),
        category: action.input.category,
        paymentMethod: action.input.paymentMethod,
        type: "gasto",
        nature: "cuota",
        amount: action.input.installmentAmount,
        status,
        installmentId,
      });
    }

    return {
      ...state,
      selectedMonth: action.input.startMonth,
      installmentPurchases: [purchase, ...state.installmentPurchases],
      installments: [...createdInstallments, ...state.installments],
      movements: [...createdMovements, ...state.movements],
      toast: "Movimiento agregado correctamente",
    };
  }

  if (action.type === "ADD_SAVINGS") {
    const savingsId = id("sav");
    const savings: SavingsMovement = {
      id: savingsId,
      date: action.input.date,
      type: action.input.type,
      fund: action.input.fund,
      usdAmount: action.input.usdAmount,
      arsAmount: action.input.arsAmount,
      exchangeRate: action.input.exchangeRate,
      detail: savingsLabel(action.input.type),
    };
    const movements =
      action.input.type === "aporte"
        ? [
            {
              id: id("mov"),
              description: "Aporte USD",
              date: action.input.date,
              category: "Ahorro USD",
              paymentMethod: "Debito o transferencia",
              type: "ahorro" as const,
              nature: "ahorro" as const,
              amount: action.input.arsAmount,
              status: "confirmado" as const,
              savingsMovementId: savingsId,
            },
            ...state.movements,
          ]
        : state.movements;

    return {
      ...state,
      selectedMonth: monthOf(action.input.date),
      savingsMovements: [savings, ...state.savingsMovements],
      movements,
      toast: "Movimiento agregado correctamente",
    };
  }

  if (action.type === "ADD_OTHER") {
    const movement: Movement = {
      id: id("mov"),
      description: action.input.description,
      date: action.input.date,
      category: action.input.category || "Otros",
      paymentMethod: "Sin impacto en consumo",
      type: "transferencia",
      nature: "otro",
      amount: action.input.amount,
      status: "confirmado",
    };

    return {
      ...state,
      selectedMonth: monthOf(action.input.date),
      movements: [movement, ...state.movements],
      toast: "Movimiento agregado correctamente",
    };
  }

  return state;
}

function savingsLabel(type: SavingsMovementType) {
  const labels: Record<SavingsMovementType, string> = {
    saldo_inicial: "Saldo inicial",
    aporte: "Aporte",
    retiro: "Retiro",
    transferencia: "Transferencia",
    ajuste_valuacion: "Ajuste de valuacion",
  };
  return labels[type];
}

export function PrototypeStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototypeStore() {
  const context = useContext(PrototypeContext);
  if (!context) {
    throw new Error("usePrototypeStore must be used inside PrototypeStoreProvider");
  }
  return context;
}

export function getMovementMonth(movement: Movement) {
  return monthOf(movement.date);
}

export function getMovementsForMonth(state: PrototypeState, month = state.selectedMonth) {
  return state.movements
    .filter((movement) => getMovementMonth(movement) === month)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getConfirmedMovementsForMonth(state: PrototypeState, month = state.selectedMonth) {
  return getMovementsForMonth(state, month).filter(
    (movement) => movement.status === "confirmado",
  );
}

export function getMonthSummary(state: PrototypeState, month = state.selectedMonth) {
  const movements = getConfirmedMovementsForMonth(state, month);
  const income = movements
    .filter((movement) => movement.type === "ingreso")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const fixed = movements
    .filter((movement) => movement.type === "gasto" && movement.nature === "fijo")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const installments = movements
    .filter((movement) => movement.type === "gasto" && movement.nature === "cuota")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const variable = movements
    .filter((movement) => movement.type === "gasto" && movement.nature === "variable")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const savings = state.savingsMovements
    .filter((movement) => movement.type === "aporte" && monthOf(movement.date) === month)
    .reduce((sum, movement) => sum + movement.arsAmount, 0);
  const totalSpent = fixed + installments + variable;

  return {
    income,
    fixed,
    installments,
    variable,
    savings,
    totalSpent,
    estimatedResult: income - totalSpent - savings,
  };
}

export function getPreviousMonthSummary(state: PrototypeState, month = state.selectedMonth) {
  return getMonthSummary(state, addMonths(month, -1));
}

export function getCategoryTotals(state: PrototypeState, month = state.selectedMonth) {
  const totals = new Map<string, number>();

  getConfirmedMovementsForMonth(state, month)
    .filter((movement) => movement.type === "gasto")
    .forEach((movement) => {
      totals.set(movement.category, (totals.get(movement.category) ?? 0) + movement.amount);
    });

  const colors = ["bg-teal-600", "bg-cyan-600", "bg-amber-600", "bg-violet-600", "bg-rose-600"];
  return Array.from(totals.entries())
    .map(([name, amount], index) => ({ name, amount, color: colors[index % colors.length] }))
    .sort((a, b) => b.amount - a.amount);
}

export function getTopExpenses(state: PrototypeState, month = state.selectedMonth, limit = 5) {
  return getConfirmedMovementsForMonth(state, month)
    .filter((movement) => movement.type === "gasto")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function getUpcomingCommitments(state: PrototypeState, month = state.selectedMonth, limit = 3) {
  return state.installments
    .filter((installment) => installment.month >= month && installment.status === "planificado")
    .sort((a, b) => a.month.localeCompare(b.month) || a.number - b.number)
    .slice(0, limit)
    .map((installment) => {
      const purchase = state.installmentPurchases.find((item) => item.id === installment.purchaseId);
      return {
        id: installment.id,
        name: purchase?.description ?? "Compra en cuotas",
        detail: `cuota ${installment.number} de ${installment.total}`,
        month: installment.month,
        amount: installment.amount,
      };
    });
}

export function getPortfolioSummary(state: PrototypeState) {
  const total = state.savingsMovements.reduce((sum, movement) => {
    if (movement.type === "retiro") return sum - movement.usdAmount;
    if (movement.type === "transferencia") return sum;
    return sum + movement.usdAmount;
  }, 0);
  const contributed = state.savingsMovements
    .filter((movement) => movement.type === "saldo_inicial" || movement.type === "aporte")
    .reduce((sum, movement) => sum + movement.usdAmount, 0);
  const valuationChange = state.savingsMovements
    .filter((movement) => movement.type === "ajuste_valuacion")
    .reduce((sum, movement) => sum + movement.usdAmount, 0);
  const byFund = new Map<string, number>();

  state.savingsMovements.forEach((movement) => {
    const current = byFund.get(movement.fund) ?? 0;
    if (movement.type === "retiro") {
      byFund.set(movement.fund, current - movement.usdAmount);
    } else if (movement.type !== "transferencia") {
      byFund.set(movement.fund, current + movement.usdAmount);
    }
  });

  return {
    total,
    contributed,
    valuationChange,
    funds: Array.from(byFund.entries()).map(([name, amount]) => ({ name, amount })),
  };
}

export function getAnnualEvolution(state: PrototypeState, year = "2026") {
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    const summary = getMonthSummary(state, month);
    return {
      month,
      label: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(
        new Date(`${month}-02T12:00:00`),
      ),
      income: summary.income,
      expenses: summary.totalSpent,
      savings: summary.savings,
    };
  }).filter((item) => item.income || item.expenses || item.savings);
}
