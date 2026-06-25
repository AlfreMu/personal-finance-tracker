export type MovementType = "ingreso" | "gasto" | "ahorro" | "transferencia";
export type MovementNature =
  | "variable"
  | "fijo"
  | "cuota"
  | "ingreso"
  | "ahorro"
  | "otro";
export type MovementStatus = "confirmado" | "planificado" | "revision";

export type Movement = {
  id: string;
  description: string;
  date: string;
  category: string;
  paymentMethod: string;
  type: MovementType;
  nature: MovementNature;
  amount: number;
  status: MovementStatus;
  note?: string;
  installmentId?: string;
  recurringRuleId?: string;
  savingsMovementId?: string;
};

export type InstallmentPurchase = {
  id: string;
  description: string;
  category: string;
  totalAmount: number;
  installmentAmount: number;
  installmentCount: number;
  startMonth: string;
  paymentMethod: string;
  endMonth: string;
};

export type Installment = {
  id: string;
  purchaseId: string;
  number: number;
  total: number;
  amount: number;
  month: string;
  status: MovementStatus;
  movementId: string;
};

export type RecurringRule = {
  id: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  startMonth: string;
  endMonth?: string;
};

export type SavingsMovementType =
  | "saldo_inicial"
  | "aporte"
  | "retiro"
  | "transferencia"
  | "ajuste_valuacion";

export type SavingsMovement = {
  id: string;
  date: string;
  type: SavingsMovementType;
  fund: string;
  usdAmount: number;
  arsAmount: number;
  exchangeRate?: number;
  detail: string;
};

export type PrototypeState = {
  movements: Movement[];
  installmentPurchases: InstallmentPurchase[];
  installments: Installment[];
  recurringRules: RecurringRule[];
  savingsMovements: SavingsMovement[];
  selectedMonth: string;
  toast?: string;
};

export type CategoryTotal = {
  name: string;
  amount: number;
  color: string;
};

export const months = [
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-05", label: "Mayo 2026" },
  { value: "2026-06", label: "Junio 2026" },
  { value: "2026-07", label: "Julio 2026" },
  { value: "2026-08", label: "Agosto 2026" },
  { value: "2026-09", label: "Septiembre 2026" },
];

export const categories = [
  "Alimentacion",
  "Transporte y moto",
  "Deportes",
  "Salud y cuidado personal",
  "Educacion",
  "Entretenimiento y suscripciones",
  "Servicios e impuestos",
  "Compras y equipamiento",
  "Regalos",
  "Mascotas",
  "Tabaco",
  "Otros",
];

export const paymentMethods = [
  "Tarjeta ICBC",
  "Mercado Pago",
  "Debito o transferencia",
  "Efectivo",
];

export const incomeSources = [
  "Trabajo principal",
  "Cliente independiente",
  "Reintegro",
  "Venta ocasional",
];

export const investmentFunds = [
  "Fondo Dolar Horizonte",
  "Renta Global",
  "Reserva USD",
];

export const initialState: PrototypeState = {
  selectedMonth: "2026-06",
  installmentPurchases: [
    {
      id: "purchase-001",
      description: "Auriculares",
      category: "Compras y equipamiento",
      totalAmount: 208000,
      installmentAmount: 52000,
      installmentCount: 4,
      startMonth: "2026-05",
      paymentMethod: "Tarjeta ICBC",
      endMonth: "2026-08",
    },
    {
      id: "purchase-002",
      description: "Curso online",
      category: "Educacion",
      totalAmount: 198000,
      installmentAmount: 66000,
      installmentCount: 3,
      startMonth: "2026-06",
      paymentMethod: "Tarjeta ICBC",
      endMonth: "2026-08",
    },
  ],
  installments: [
    {
      id: "inst-001",
      purchaseId: "purchase-001",
      number: 2,
      total: 4,
      amount: 52000,
      month: "2026-06",
      status: "confirmado",
      movementId: "mov-004",
    },
    {
      id: "inst-002",
      purchaseId: "purchase-001",
      number: 3,
      total: 4,
      amount: 52000,
      month: "2026-07",
      status: "planificado",
      movementId: "mov-011",
    },
    {
      id: "inst-003",
      purchaseId: "purchase-001",
      number: 4,
      total: 4,
      amount: 52000,
      month: "2026-08",
      status: "planificado",
      movementId: "mov-012",
    },
    {
      id: "inst-004",
      purchaseId: "purchase-002",
      number: 1,
      total: 3,
      amount: 66000,
      month: "2026-06",
      status: "planificado",
      movementId: "mov-009",
    },
    {
      id: "inst-005",
      purchaseId: "purchase-002",
      number: 2,
      total: 3,
      amount: 66000,
      month: "2026-07",
      status: "planificado",
      movementId: "mov-013",
    },
    {
      id: "inst-006",
      purchaseId: "purchase-002",
      number: 3,
      total: 3,
      amount: 66000,
      month: "2026-08",
      status: "planificado",
      movementId: "mov-014",
    },
  ],
  recurringRules: [
    {
      id: "rec-001",
      description: "Seguro de moto",
      category: "Transporte y moto",
      amount: 69000,
      paymentMethod: "Debito o transferencia",
      startMonth: "2026-01",
    },
    {
      id: "rec-002",
      description: "Suscripcion educativa",
      category: "Educacion",
      amount: 38000,
      paymentMethod: "Tarjeta ICBC",
      startMonth: "2026-03",
    },
  ],
  savingsMovements: [
    {
      id: "sav-001",
      date: "2026-06-02",
      type: "saldo_inicial",
      fund: "Fondo Dolar Horizonte",
      usdAmount: 1800,
      arsAmount: 0,
      detail: "Saldo inicial",
    },
    {
      id: "sav-002",
      date: "2026-06-12",
      type: "aporte",
      fund: "Renta Global",
      usdAmount: 220,
      arsAmount: 210000,
      exchangeRate: 954,
      detail: "Aporte en dolares",
    },
    {
      id: "sav-003",
      date: "2026-06-22",
      type: "ajuste_valuacion",
      fund: "Reserva USD",
      usdAmount: 65,
      arsAmount: 0,
      detail: "Ajuste de valuacion",
    },
  ],
  movements: [
    {
      id: "mov-001",
      description: "Sueldo mensual",
      date: "2026-06-03",
      category: "Ingreso",
      paymentMethod: "ICBC pesos",
      type: "ingreso",
      nature: "ingreso",
      amount: 1480000,
      status: "confirmado",
    },
    {
      id: "mov-002",
      description: "Compra de supermercado",
      date: "2026-06-04",
      category: "Alimentacion",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "variable",
      amount: 84500,
      status: "confirmado",
    },
    {
      id: "mov-003",
      description: "Seguro de moto",
      date: "2026-06-05",
      category: "Transporte y moto",
      paymentMethod: "Debito o transferencia",
      type: "gasto",
      nature: "fijo",
      amount: 69000,
      status: "confirmado",
      recurringRuleId: "rec-001",
    },
    {
      id: "mov-004",
      description: "Auriculares - cuota 2 de 4",
      date: "2026-06-07",
      category: "Compras y equipamiento",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "cuota",
      amount: 52000,
      status: "confirmado",
      installmentId: "inst-001",
    },
    {
      id: "mov-005",
      description: "Carga de combustible",
      date: "2026-06-09",
      category: "Transporte y moto",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "variable",
      amount: 41000,
      status: "confirmado",
    },
    {
      id: "mov-006",
      description: "Aporte USD",
      date: "2026-06-12",
      category: "Ahorro USD",
      paymentMethod: "Debito o transferencia",
      type: "ahorro",
      nature: "ahorro",
      amount: 210000,
      status: "confirmado",
      savingsMovementId: "sav-002",
    },
    {
      id: "mov-007",
      description: "Suscripcion educativa",
      date: "2026-06-14",
      category: "Educacion",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "fijo",
      amount: 38000,
      status: "confirmado",
      recurringRuleId: "rec-002",
    },
    {
      id: "mov-008",
      description: "Cena y salida",
      date: "2026-06-18",
      category: "Entretenimiento y suscripciones",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "variable",
      amount: 57500,
      status: "confirmado",
    },
    {
      id: "mov-009",
      description: "Curso online - cuota 1 de 3",
      date: "2026-06-20",
      category: "Educacion",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "cuota",
      amount: 66000,
      status: "planificado",
      installmentId: "inst-004",
    },
    {
      id: "mov-010",
      description: "Regalo de cumpleanos",
      date: "2026-06-21",
      category: "Regalos",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "variable",
      amount: 36000,
      status: "confirmado",
    },
    {
      id: "mov-011",
      description: "Auriculares - cuota 3 de 4",
      date: "2026-07-07",
      category: "Compras y equipamiento",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "cuota",
      amount: 52000,
      status: "planificado",
      installmentId: "inst-002",
    },
    {
      id: "mov-012",
      description: "Auriculares - cuota 4 de 4",
      date: "2026-08-07",
      category: "Compras y equipamiento",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "cuota",
      amount: 52000,
      status: "planificado",
      installmentId: "inst-003",
    },
    {
      id: "mov-013",
      description: "Curso online - cuota 2 de 3",
      date: "2026-07-20",
      category: "Educacion",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "cuota",
      amount: 66000,
      status: "planificado",
      installmentId: "inst-005",
    },
    {
      id: "mov-014",
      description: "Curso online - cuota 3 de 3",
      date: "2026-08-20",
      category: "Educacion",
      paymentMethod: "Tarjeta ICBC",
      type: "gasto",
      nature: "cuota",
      amount: 66000,
      status: "planificado",
      installmentId: "inst-006",
    },
  ],
};
