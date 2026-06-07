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

export type NotificationFilter = "all" | "read" | "unread";

export type ParkingNotification = {
  content: string;
  createdAt: string;
  id: string;
  isRead: boolean;
  notificationType: NotificationType;
  title: string;
};

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
