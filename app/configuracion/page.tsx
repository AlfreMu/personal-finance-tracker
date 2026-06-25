const sections = [
  { title: "Categorias", description: "Nombres, colores y orden de categorias." },
  { title: "Medios de pago", description: "Tarjeta ICBC, Mercado Pago, debito y efectivo." },
  { title: "Cuentas", description: "Cuentas propias para organizar saldos." },
  { title: "Tarjetas", description: "Resumen de tarjetas y fechas de cierre." },
  { title: "Fuentes de ingreso", description: "Sueldo, honorarios, reintegros y otros ingresos." },
  { title: "Fondos de inversion", description: "Destinos usados en Ahorros USD." },
  { title: "Importacion", description: "Carga de movimientos desde archivos." },
  { title: "Exportacion", description: "Salida de movimientos en CSV o JSON." },
  { title: "Preferencias", description: "Formato, moneda principal y ajustes visuales." },
];

export default function ConfiguracionPage() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Configuracion</p>
        <h1 className="mt-1 text-3xl font-semibold text-stone-950">Configuracion</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          Secciones base para administrar catalogos, cuentas y preferencias.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{section.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
