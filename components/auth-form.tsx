"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/app/auth-actions";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  mode?: "login" | "signup";
};

const initialState: AuthFormState = {};

export function AuthForm({ action, submitLabel, mode = "login" }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {mode === "signup" ? (
        <div>
          <label className="text-sm font-medium text-stone-700" htmlFor="displayName">
            Nombre
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            id="displayName"
            name="displayName"
            autoComplete="name"
          />
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-stone-700" htmlFor="email">
          Email
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-stone-700" htmlFor="password">
          Contrasena
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </div>

      {mode === "signup" ? (
        <div>
          <label className="text-sm font-medium text-stone-700" htmlFor="confirmPassword">
            Confirmar contrasena
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
      ) : null}

      {state.message ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {state.success}
        </p>
      ) : null}

      <button
        className="min-h-11 w-full rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "Procesando..." : submitLabel}
      </button>
    </form>
  );
}
