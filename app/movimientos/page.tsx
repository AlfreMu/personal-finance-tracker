import { MovimientosClient } from "./movimientos-client";

type MovimientosPageProps = {
  searchParams: Promise<{ filtro?: string }>;
};

export default async function MovimientosPage({ searchParams }: MovimientosPageProps) {
  const params = await searchParams;
  return <MovimientosClient initialQuickFilter={params.filtro ?? "todos"} />;
}
