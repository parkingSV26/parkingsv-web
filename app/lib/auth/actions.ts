"use server";

import { redirect } from "next/navigation";
import { clearUserSession } from "@/app/lib/auth/session";

export async function logoutAction() {
  // Limpiamos la cookie antes de redirigir para que cualquier layout lea el estado correcto.
  await clearUserSession();
  redirect("/login");
}
