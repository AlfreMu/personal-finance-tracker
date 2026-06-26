"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  message?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateEmailPassword(email: string, password: string) {
  if (!email || !email.includes("@")) return "Ingresa un email valido.";
  if (password.length < 6) return "La contrasena debe tener al menos 6 caracteres.";
  return undefined;
}

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");
  const displayName = readString(formData, "displayName");
  const validationError = validateEmailPassword(email, password);

  if (validationError) return { message: validationError };
  if (password !== confirmPassword) return { message: "Las contrasenas no coinciden." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || null,
      },
    },
  });

  if (error) return { message: error.message };

  if (data.session) {
    await supabase.rpc("bootstrap_current_user_defaults");
    redirect("/");
  }

  return {
    success:
      "Cuenta creada. Revisa tu email si Supabase pide confirmacion antes de iniciar sesion.",
  };
}

export async function signInAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const validationError = validateEmailPassword(email, password);

  if (validationError) return { message: validationError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { message: "No pudimos iniciar sesion con esas credenciales." };

  await supabase.rpc("bootstrap_current_user_defaults");
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
