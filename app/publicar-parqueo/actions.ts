"use server";

import { getSessionUser } from "@/app/lib/auth/session";
import {
  STATIC_PUBLISHED_PARKING_ID,
  type PublishParkingState,
} from "@/app/publicar-parqueo/publish-parking-state";

export async function publishParkingAction(
  previousState: PublishParkingState,
  formData: FormData,
): Promise<PublishParkingState> {
  const sessionUser = await getSessionUser();

  // Aunque la publicación sigue siendo estática, respetamos permisos para no romper el flujo futuro.
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
      errorMessage: "Solo las cuentas de propietario pueden entrar a esta publicacion.",
      publishedParkingId: null,
      revision: previousState.revision + 1,
      successMessage: "",
    };
  }

  if (formData.get("accept_terms") !== "on") {
    return {
      errorMessage: "Acepta los terminos para continuar.",
      publishedParkingId: null,
      revision: previousState.revision + 1,
      successMessage: "",
    };
  }

  return {
    errorMessage: "",
    publishedParkingId: STATIC_PUBLISHED_PARKING_ID,
    revision: previousState.revision + 1,
    successMessage: "Publicacion enviada correctamente. Ya puedes revisar el detalle publicado.",
  };
}
