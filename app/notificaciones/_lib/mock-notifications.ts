import type { SessionUser } from "@/app/lib/auth/session";

export type NotificationType =
  | "review_response"
  | "parking_update"
  | "price_drop"
  | "new_feature"
  | "security_alert"
  | "saved_parking_news"
  | "system_news"
  | "reservation_reminder"
  | "promotion"
  | "owner_specific"
  | "admin_alert";

export type ParkingNotification = {
  content: string;
  createdAt: string;
  id: string;
  isRead: boolean;
  notificationType: NotificationType;
  title: string;
};

export type NotificationFilter = "all" | "read" | "unread";

export const notificationTypeColors: Record<NotificationType, string> = {
  review_response: "#0C6FF9",
  parking_update: "#4CAF50",
  price_drop: "#FF9800",
  new_feature: "#9C27B0",
  security_alert: "#F44336",
  saved_parking_news: "#03A9F4",
  system_news: "#607D8B",
  reservation_reminder: "#FFC107",
  promotion: "#E91E63",
  owner_specific: "#2E7D32",
  admin_alert: "#B71C1C",
};

export const notificationTypeNames: Record<NotificationType, string> = {
  review_response: "Respuesta a reseña",
  parking_update: "Actualización de parqueo",
  price_drop: "Oferta de precio",
  new_feature: "Nueva función",
  security_alert: "Alerta de seguridad",
  saved_parking_news: "Noticias de parqueo guardado",
  system_news: "Noticias del sistema",
  reservation_reminder: "Recordatorio de reservación",
  promotion: "Promocion",
  owner_specific: "Información para propietarios",
  admin_alert: "Alerta de administrador",
};

export function createMockNotifications(user: SessionUser): ParkingNotification[] {
  const now = new Date();
  const firstName = user.fullName.split(" ")[0] ?? user.fullName;

  const baseNotifications: ParkingNotification[] = [
    {
      id: `${user.id}-notif-review`,
      notificationType: "review_response",
      title: "Respondieron tu última reseña",
      content: `Hola ${firstName}, el propietario de Parqueo El Portalito respondio tu comentario y agradecio tus observaciones sobre el acceso.`,
      createdAt: minutesAgo(now, 35),
      isRead: false,
    },
    {
      id: `${user.id}-notif-price`,
      notificationType: "price_drop",
      title: "Bajó el precio de un parqueo guardado",
      content:
        "Parqueo Cubierto Las Palmeras actualizo su tarifa principal y ahora tiene una promocion temporal para visitas cortas.",
      createdAt: hoursAgo(now, 6),
      isRead: false,
    },
    {
      id: `${user.id}-notif-feature`,
      notificationType: "new_feature",
      title: "Ya puedes organizar tus parqueos favoritos",
      content:
        "La nueva experiencia de guardados en Next.js ya permite crear carpetas y ordenar tus parqueos guardados localmente.",
      createdAt: daysAgo(now, 1, 2),
      isRead: true,
    },
    {
      id: `${user.id}-notif-security`,
      notificationType: "security_alert",
      title: "Nuevo acceso detectado en tu cuenta",
      content:
        "Tu sesion se inicio correctamente desde un navegador reciente. Si no fuiste tu, cambia tus credenciales cuanto antes.",
      createdAt: daysAgo(now, 2, 5),
      isRead: true,
    },
    {
      id: `${user.id}-notif-system`,
      notificationType: "system_news",
      title: "Actualizamos la experiencia del sitio",
      content:
        "Seguimos mejorando velocidad, organizacion del codigo y experiencia general para usuarios y propietarios.",
      createdAt: daysAgo(now, 4, 4),
      isRead: false,
    },
  ];

  const roleSpecificNotification: ParkingNotification =
    user.userType === "owner"
      ? {
          id: `${user.id}-notif-owner`,
          notificationType: "owner_specific",
          title: "Tu panel de propietario tendra nuevas opciones",
          content:
            "Pronto podrás administrar publicaciónes, respuestas y alertas desde una vista unificada para propietarios dentro de Next.js.",
          createdAt: daysAgo(now, 1, 6),
          isRead: false,
        }
      : {
          id: `${user.id}-notif-reservation`,
          notificationType: "reservation_reminder",
          title: "Recuerda revisar tus reservas próximas",
          content:
            "Si planeas estacionarte esta semana, revisa disponibilidad y tarifas actualizadas antes de salir para evitar sorpresas.",
          createdAt: hoursAgo(now, 18),
          isRead: false,
        };

  const extraNotification: ParkingNotification = {
    id: `${user.id}-notif-promo`,
    notificationType: "promotion",
    title: "Promocion destacada para usuarios activos",
    content:
      "Algunos parqueos de alta demanda están destacando promociones de temporada. Revisa tus favoritos y compara opciones disponibles.",
    createdAt: daysAgo(now, 6, 3),
    isRead: true,
  };

  return [
    baseNotifications[0],
    baseNotifications[1],
    roleSpecificNotification,
    baseNotifications[2],
    baseNotifications[3],
    baseNotifications[4],
    extraNotification,
  ];
}

function minutesAgo(baseDate: Date, minutes: number) {
  return new Date(baseDate.getTime() - minutes * 60 * 1000).toISOString();
}

function hoursAgo(baseDate: Date, hours: number) {
  return new Date(baseDate.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(baseDate: Date, days: number, extraHours = 0) {
  return new Date(baseDate.getTime() - (days * 24 + extraHours) * 60 * 60 * 1000).toISOString();
}
