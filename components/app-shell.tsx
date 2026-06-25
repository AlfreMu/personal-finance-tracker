"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { PrototypeStoreProvider, usePrototypeStore } from "@/lib/prototype-store";
import {
  IconChart,
  IconDollar,
  IconHome,
  IconList,
  IconSettings,
} from "./icons";
import { OpenMovementButton } from "./open-movement-button";
import { AddMovementDrawer } from "./add-movement-drawer";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "Inicio", icon: IconHome },
  { href: "/movimientos", label: "Movimientos", icon: IconList },
  { href: "/estadisticas", label: "Estadisticas", icon: IconChart },
  { href: "/ahorros", label: "Ahorros USD", icon: IconDollar },
  { href: "/configuracion", label: "Configuracion", icon: IconSettings },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <PrototypeStoreProvider>
      <AppShellContent>{children}</AppShellContent>
    </PrototypeStoreProvider>
  );
}

function AppShellContent({ children }: AppShellProps) {
  const pathname = usePathname();
  const { state, dispatch } = usePrototypeStore();

  useEffect(() => {
    if (!state.toast) return;
    const timeout = window.setTimeout(() => {
      dispatch({ type: "SET_TOAST", message: undefined });
    }, 2400);
    return () => window.clearTimeout(timeout);
  }, [dispatch, state.toast]);

  return (
    <div className="min-h-dvh bg-stone-50 text-stone-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone-950"
      >
        Saltar al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200 bg-white px-4 py-5 lg:block">
        <div className="flex h-full flex-col">
          <Link href="/" className="rounded-lg px-2 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            <p className="text-sm font-medium text-emerald-700">Finanzas personales</p>
            <p className="text-xl font-semibold text-stone-950">Control mensual</p>
          </Link>
          <nav className="mt-8 space-y-1" aria-label="Navegacion principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                    active ? "bg-emerald-50 text-emerald-900" : "text-stone-700 hover:bg-stone-100"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main id="main-content" className="min-h-dvh pb-28 lg:pl-64 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <p className="mb-4 rounded-full bg-white px-4 py-2 text-xs font-medium text-stone-600 shadow-sm ring-1 ring-stone-200">
            Modo demostracion: los datos no se guardan al recargar.
          </p>
          {children}
        </div>
      </main>

      <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
        <OpenMovementButton className="shadow-lg" />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Navegacion movil">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  active ? "bg-emerald-50 text-emerald-900" : "text-stone-600"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AddMovementDrawer />

      {state.toast ? (
        <div
          className="fixed left-4 right-4 top-4 z-[70] mx-auto max-w-sm rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg"
          role="status"
        >
          {state.toast}
        </div>
      ) : null}
    </div>
  );
}
