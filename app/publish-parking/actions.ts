"use server";

import { getSessionUser } from "@/app/lib/auth/session";
import { publishParkingFromFormData, updateParkingFromFormData } from "./_lib/publish-parking";
import type { PublishParkingState } from "./publish-parking-state";

export async function publishParkingAction(
  previousState: PublishParkingState,
  formData: FormData,
): Promise<PublishParkingState> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return {
      errorMessage: "Necesitas iniciar sesion para publicar un parqueo.",
      publishedParkingId: null,
      revision: previousState.revision + 1,
      successMessage: "",
    };
  }

  if (sessionUser.userType !== "owner") {
    return {
      errorMessage: "Solo las cuentas de propietario pueden publicar parqueos.",
      publishedParkingId: null,
      revision: previousState.revision + 1,
      successMessage: "",
    };
  }

  const parkingMode = String(formData.get("parking_mode") ?? "create");

  if (parkingMode !== "edit" && formData.get("accept_terms") !== "on") {
    return {
      errorMessage: "Acepta los terminos para continuar.",
      publishedParkingId: null,
      revision: previousState.revision + 1,
      successMessage: "",
    };
  }

  try {
    const { parkingId } =
      parkingMode === "edit"
        ? await updateParkingFromFormData(sessionUser, formData)
        : await publishParkingFromFormData(sessionUser, formData);

    return {
      errorMessage: "",
      publishedParkingId: String(parkingId),
      revision: previousState.revision + 1,
      successMessage:
        parkingMode === "edit"
          ? "Tu parqueo se actualizo correctamente en Supabase."
          : "Tu parqueo se publico correctamente en Supabase.",
    };
  } catch (error) {
    console.error("Failed to save parking.", error);

    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : parkingMode === "edit"
            ? "No se pudo actualizar el parqueo. Intenta de nuevo."
            : "No se pudo publicar el parqueo. Intenta de nuevo.",
      publishedParkingId: null,
      revision: previousState.revision + 1,
      successMessage: "",
    };
  }
}
