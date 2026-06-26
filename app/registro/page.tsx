import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUpAction } from "../auth-actions";

export default function RegistroPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Finanzas personales
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">Crear cuenta</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          El perfil y las configuraciones iniciales se crean automáticamente al registrarte.
        </p>
        <AuthForm action={signUpAction} submitLabel="Crear cuenta" mode="signup" />
        <p className="mt-6 text-sm text-stone-600">
          ¿Ya tenés cuenta?{" "}
          <Link className="font-semibold text-emerald-700 hover:text-emerald-900" href="/login">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </main>
  );
}
