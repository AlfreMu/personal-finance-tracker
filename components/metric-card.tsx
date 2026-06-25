type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "positive" | "warning" | "accent";
};

const toneClasses = {
  neutral: "border-stone-200 bg-white",
  positive: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  accent: "border-cyan-200 bg-cyan-50",
};

export function MetricCard({ label, value, helper, tone = "neutral" }: MetricCardProps) {
  return (
    <article className={`rounded-lg border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-normal text-stone-950">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-5 text-stone-600">{helper}</p> : null}
    </article>
  );
}
