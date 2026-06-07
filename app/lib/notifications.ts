import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { NotificationType } from "@/app/notifications/_lib/notification-types";
import { formatSupabaseErrorForLog } from "@/src/lib/supabase/errors";

type NotificationRow = {
  content: string;
  created_at: string;
  id: number;
  is_read: boolean | null;
  notification_type: NotificationType;
  title: string;
};

export async function getNotificationsForUser(userId: number) {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .select("id, title, content, notification_type, created_at, is_read")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as NotificationRow[]).map((notification) => ({
      content: notification.content,
      createdAt: notification.created_at,
      id: String(notification.id),
      isRead: Boolean(notification.is_read),
      notificationType: notification.notification_type,
      title: notification.title,
    }));
  } catch (error) {
    console.warn("Failed to load notifications.", formatSupabaseErrorForLog(error));
    return [];
  }
}
