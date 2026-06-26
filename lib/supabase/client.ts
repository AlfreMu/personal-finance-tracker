"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseBrowserEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabaseBrowserEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
