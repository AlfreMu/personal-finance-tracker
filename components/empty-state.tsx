type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center">
      <p className="text-base font-semibold text-stone-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
