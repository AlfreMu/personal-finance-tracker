import { EstadisticasClient } from "./estadisticas-client";
import { getFinancePageData } from "@/lib/finance/queries";

type EstadisticasPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function EstadisticasPage({ searchParams }: EstadisticasPageProps) {
  const params = await searchParams;
  const data = await getFinancePageData(params.month);
  return <EstadisticasClient data={data} />;
}
