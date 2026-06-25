"use client";

import { IconPlus } from "./icons";

export type AddMovementMode =
  | "card"
  | "income"
  | "recurring"
  | "installment"
  | "usd"
  | "other";

type OpenMovementButtonProps = {
  label?: string;
  mode?: AddMovementMode;
  className?: string;
  compact?: boolean;
};

export function openMovementDrawer(mode: AddMovementMode = "card") {
  window.dispatchEvent(
    new CustomEvent("open-add-movement", {
      detail: { mode },
    }),
  );
}

export function OpenMovementButton({
  label = "Agregar movimiento",
  mode = "card",
  className = "",
  compact = false,
}: OpenMovementButtonProps) {
  return (
    <button
      type="button"
      onClick={() => openMovementDrawer(mode)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${className}`}
    >
      <IconPlus className="h-4 w-4" />
      <span>{compact ? "+" : label}</span>
    </button>
  );
}
