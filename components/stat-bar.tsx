type StatBarProps = {
  label: string;
  value: string;
  percent: number;
  color?: string;
};

export function StatBar({ label, value, percent, color = "bg-emerald-700" }: StatBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="font-semibold tabular-nums text-stone-950">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-100" role="presentation">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
