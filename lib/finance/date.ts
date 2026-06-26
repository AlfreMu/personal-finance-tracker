const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function currentMonthValue() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

export function normalizeMonth(value?: string | null) {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : currentMonthValue();
}

export function monthStart(month: string) {
  return `${month}-01`;
}

export function addMonths(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

export function monthAfter(month: string) {
  return monthStart(addMonths(month, 1));
}

export function formatMonthLabel(month: string) {
  return monthFormatter.format(new Date(`${month}-01T00:00:00.000Z`));
}

export function monthOptionsAround(selectedMonth: string) {
  return Array.from({ length: 13 }, (_, index) => {
    const value = addMonths(selectedMonth, index - 6);
    return { value, label: formatMonthLabel(value) };
  });
}
