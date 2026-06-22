"use server";

import { redirect } from "next/navigation";
import { clearUserSession } from "@/app/lib/auth/session";

export async function logoutAction() {
  // Clear the cookie before redirecting so every layout reads the latest state.
  await clearUserSession();
  redirect("/login");
}
