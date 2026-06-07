"use client";

import { useEffect, useState } from "react";
import type {
  NotificationFilter,
  ParkingNotification,
} from "@/app/notifications/_lib/notification-types";
import {
  notificationTypeColors,
  notificationTypeNames,
} from "@/app/notifications/_lib/notification-types";
import styles from "./notifications.module.css";

type NotificationsClientProps = {
  initialNotifications: ParkingNotification[];
};

const filterOptions: Array<{ label: string; value: NotificationFilter }> = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "No leídas" },
  { value: "read", label: "Leídas" },
];

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    function handleOutsideClick() {
      setActiveMenuId(null);
      setFilterMenuOpen(false);
    }

    if (!activeMenuId && !filterMenuOpen) {
      return;
    }

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [activeMenuId, filterMenuOpen]);

  const filteredNotifications =
    filter === "read"
      ? notifications.filter((notification) => notification.isRead)
      : filter === "unread"
        ? notifications.filter((notification) => !notification.isRead)
        : notifications;

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  async function handleToggleRead(notificationId: string) {
    const currentNotification =
      notifications.find((notification) => notification.id === notificationId) ?? null;

    if (!currentNotification) {
      return;
    }

    const nextIsRead = !currentNotification.isRead;
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: nextIsRead,
            }
          : notification,
      ),
    );

    const response = await fetch(`/api/notifications/${notificationId}`, {
      body: JSON.stringify({ isRead: nextIsRead }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });

    if (!response.ok) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: currentNotification.isRead,
              }
            : notification,
        ),
      );
    }

    setActiveMenuId(null);
  }

  async function handleDelete(notificationId: string) {
    const previousNotifications = notifications;
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );

    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setNotifications(previousNotifications);
    }

    setActiveMenuId(null);
  }

  async function handleMarkAllRead() {
    const previousNotifications = notifications;
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    const response = await fetch("/api/notifications", {
      method: "PATCH",
    });

    if (!response.ok) {
      setNotifications(previousNotifications);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <h1>
              <i className="fas fa-bell" aria-hidden="true" /> Tus notificaciones
            </h1>
            <p>
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificacion${unreadCount === 1 ? "" : "es"} sin leer.`
                : "No tienes notificaciones pendientes por leer."}
            </p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.filterWrap}>
              <button
                type="button"
                className={`${styles.button} ${styles.outlineButton}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setFilterMenuOpen((current) => !current);
                  setActiveMenuId(null);
                }}
              >
                <i className="fas fa-filter" aria-hidden="true" /> Filtrar
              </button>

              <div
                className={`${styles.filterMenu} ${filterMenuOpen ? styles.filterMenuOpen : ""}`}
                onClick={(event) => event.stopPropagation()}
              >
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.filterMenuItem} ${
                      filter === option.value ? styles.filterMenuItemActive : ""
                    }`}
                    onClick={() => {
                      setFilter(option.value);
                      setFilterMenuOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {filter === option.value ? <i className="fas fa-check" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={() => void handleMarkAllRead()}
            >
              <i className="fas fa-check-double" aria-hidden="true" /> Marcar todas como leídas
            </button>
          </div>
        </header>

        <div className={styles.statusRow}>
          <span className={styles.statusChip}>
            <strong>{notifications.length}</strong> total
          </span>
          <span className={styles.statusChip}>
            <strong>{unreadCount}</strong> sin leer
          </span>
          <span className={styles.statusChip}>
            Filtro actual: <strong>{filterOptions.find((option) => option.value === filter)?.label}</strong>
          </span>
        </div>

        <div className={styles.notificationsList}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const notificationColor = notificationTypeColors[notification.notificationType];
              const notificationTypeName = notificationTypeNames[notification.notificationType];

              return (
                <article
                  key={notification.id}
                  className={`${styles.notificationItem} ${
                    notification.isRead ? styles.notificationRead : styles.notificationUnread
                  }`}
                  style={{ borderLeftColor: notificationColor }}
                >
                  <div className={styles.notificationHeader}>
                    <span
                      className={styles.notificationType}
                      style={{ backgroundColor: notificationColor }}
                    >
                      {notificationTypeName}
                    </span>
                    <span className={styles.notificationDate}>
                      {formatFriendlyDate(notification.createdAt)}
                    </span>
                  </div>

                  <h2 className={styles.notificationTitle}>{notification.title}</h2>
                  <p className={styles.notificationContent}>{notification.content}</p>

                  <div className={styles.notificationActions}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      aria-label="Abrir acciones de notificacion"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFilterMenuOpen(false);
                        setActiveMenuId((current) =>
                          current === notification.id ? null : notification.id,
                        );
                      }}
                    >
                      <i className="fas fa-ellipsis-v" aria-hidden="true" />
                    </button>

                    <div
                      className={`${styles.actionMenu} ${
                        activeMenuId === notification.id ? styles.actionMenuOpen : ""
                      }`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={styles.actionMenuItem}
                        onClick={() => void handleToggleRead(notification.id)}
                      >
                        <i
                          className={`fas ${
                            notification.isRead ? "fa-envelope" : "fa-envelope-open"
                          }`}
                          aria-hidden="true"
                        />
                        <span>
                          {notification.isRead ? "Marcar como no leída" : "Marcar como leída"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.actionMenuItem} ${styles.actionMenuDelete}`}
                        onClick={() => void handleDelete(notification.id)}
                      >
                        <i className="fas fa-trash" aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <i className="fas fa-bell-slash" aria-hidden="true" />
              <h3>No tienes notificaciones</h3>
              <p>Cuando tengas nuevas notificaciones, aparecerán aquí.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatFriendlyDate(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTargetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.round((startOfToday - startOfTargetDay) / oneDayInMs);

  if (dayDifference === 0) {
    return `Hoy a las ${formatTime(date)}`;
  }

  if (dayDifference === 1) {
    return `Ayer a las ${formatTime(date)}`;
  }

  if (dayDifference < 7) {
    return `Hace ${dayDifference} días`;
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${formatTime(date)}`;
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
