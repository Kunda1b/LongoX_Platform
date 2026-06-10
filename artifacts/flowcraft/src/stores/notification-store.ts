import { create } from "zustand";

type Notification = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  body?: string;
  channel: string;
  status: "unread" | "read" | "delivered" | "failed";
  createdAt: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  panelOpen: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status === "unread").length,
    }),
  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.status === "unread" ? 1 : 0),
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, status: "read" as const } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setPanelOpen: (open) => set({ panelOpen: open }),
}));
