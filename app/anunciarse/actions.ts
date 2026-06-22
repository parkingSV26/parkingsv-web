"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/lib/auth/session";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { formatSupabaseErrorForLog, getSupabaseFriendlyErrorMessage } from "@/src/lib/supabase/errors";
import type { AnunciarseFormState } from "./anunciarse-form-state";

const businessCategories = new Set([
  "carwash",
  "restaurant",
  "workshop",
  "shop",
  "tourism",
  "service",
  "other",
]);

const campaignGoals = new Set([
  "awareness",
  "leads",
  "reservations",
  "sales",
  "traffic",
  "other",
]);

const budgetRanges = new Set([
  "sin_definir",
  "menos_100",
  "100_250",
  "250_500",
  "500_plus",
]);

const contactMethods = new Set(["email", "whatsapp", "call"]);

function createState(
  errorMessage = "",
  fieldErrors: AnunciarseFormState["fieldErrors"] = {},
  successMessage = "",
): AnunciarseFormState {
  return {
    errorMessage,
    fieldErrors,
    successMessage,
  };
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitAnnouncementRequestAction(
  _previousState: AnunciarseFormState,
  formData: FormData,
): Promise<AnunciarseFormState> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?redirect=%2Fanunciarse");
  }

  const businessName = readString(formData, "business_name");
  const category = readString(formData, "business_category");
  const campaignGoal = readString(formData, "campaign_goal");
  const description = readString(formData, "description");
  const budgetRange = readString(formData, "budget_range");
  const preferredContact = readString(formData, "preferred_contact");
  const websiteOrSocial = readString(formData, "website_or_social");
  const termsAccepted = formData.get("terms_accepted") === "on";

  const fieldErrors: AnunciarseFormState["fieldErrors"] = {};

  if (businessName.length < 2) {
    fieldErrors.businessName = "Escribe el nombre de tu negocio o proyecto.";
  }

  if (!businessCategories.has(category)) {
    fieldErrors.category = "Selecciona la categoría de tu negocio.";
  }

  if (!campaignGoals.has(campaignGoal)) {
    fieldErrors.campaignGoal = "Selecciona el objetivo de la campaña.";
  }

  if (description.length < 20) {
    fieldErrors.description = "Describe con más detalle qué quieres anunciar.";
  }

  if (!budgetRanges.has(budgetRange)) {
    fieldErrors.budgetRange = "Selecciona un rango de inversión.";
  }

  if (!contactMethods.has(preferredContact)) {
    fieldErrors.preferredContact = "Selecciona tu canal de contacto preferido.";
  }

  if (websiteOrSocial.length > 200) {
    fieldErrors.websiteOrSocial = "Usa un enlace o referencia más corta.";
  }

  if (!termsAccepted) {
    fieldErrors.termsAccepted = "Debes aceptar los términos para continuar.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createState("", fieldErrors);
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("advertising_requests").insert({
      budget_range: budgetRange === "sin_definir" ? null : budgetRange,
      business_category: category,
      business_name: businessName,
      campaign_goal: campaignGoal,
      contact_email: user.email,
      contact_name: user.fullName,
      contact_phone: user.phoneNumber,
      description,
      preferred_contact: preferredContact,
      terms_accepted: true,
      user_id: user.id,
      website_or_social: websiteOrSocial || null,
    });

    if (error) {
      throw error;
    }

    return createState(
      "",
      {},
      "Tu solicitud fue enviada. Te responderemos en un máximo de 7 días.",
    );
  } catch (error) {
    console.error("Failed to store advertisement request.", formatSupabaseErrorForLog(error));

    return createState(
      getSupabaseFriendlyErrorMessage(error, "No pudimos guardar tu solicitud. Intenta nuevamente."),
    );
  }
}
