import { MovimientosClient } from "./movimientos-client";
import { getFinancePageData } from "@/lib/finance/queries";

type MovimientosPageProps = {
  searchParams: Promise<{ filtro?: string; month?: string }>;
};

export default async function MovimientosPage({ searchParams }: MovimientosPageProps) {
  const params = await searchParams;
  const data = await getFinancePageData(params.month);
  return (
    <MovimientosClient
      initialQuickFilter={params.filtro ?? "todos"}
      selectedMonth={data.selectedMonth}
      movements={data.movements}
      catalogs={data.catalogs}
    />
  );
}
