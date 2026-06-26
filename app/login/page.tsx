import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signInAction } from "../auth-actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Finanzas personales
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">Iniciar sesion</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Entra para ver tus datos protegidos y persistidos en Supabase.
        </p>
        <AuthForm action={signInAction} submitLabel="Ingresar" />
        <p className="mt-6 text-sm text-stone-600">
          No tenes cuenta?{" "}
          <Link className="font-semibold text-emerald-700 hover:text-emerald-900" href="/registro">
            Crear una
          </Link>
        </p>
      </div>
    </main>
  );
}
