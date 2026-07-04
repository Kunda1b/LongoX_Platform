import { create } from "zustand";

interface NotificationState {
  notifications: Array<{ id: string; title: string; body: string | null; type: string; status: string; createdAt: string }>;
  unreadCount: number;
  setNotifications: (notifications: NotificationState["notifications"]) => void;
  markAllRead: () => void;
  addNotification: (notification: NotificationState["notifications"][number]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status === "unread").length,
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, status: "read" })),
      unreadCount: 0,
    })),
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + (notification.status === "unread" ? 1 : 0),
    })),
}));
