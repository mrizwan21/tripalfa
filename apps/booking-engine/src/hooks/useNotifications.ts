import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { api as ApiClientInstance } from "../lib/api";
// Lazy import to avoid circular dependency
type ApiClient = typeof ApiClientInstance;
let api: ApiClient | undefined;
function getApi() {
  if (!api) api = require("../lib/api").api as ApiClient;
  return api;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: string[];
  priority: "low" | "medium" | "high";
  status: "sent" | "read" | "archived";
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  offlineRequestUpdates: boolean;
  priceDropAlerts: boolean;
  bookingReminders: boolean;
  promotionalEmails: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Hook for managing user notifications
 */
export const useNotifications = (limit = 20): UseNotificationsReturn => {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", offset],
    queryFn: async () => {
      const response = await getApi().get(
        `/notifications?limit=${limit}&offset=${offset}`,
      );
      return response;
    },
    staleTime: 30000, // 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await getApi().patch(`/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await getApi().patch("/notifications/read-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await getApi().delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const loadMore = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  return {
    notifications: data?.data || [],
    unreadCount: data?.meta?.unreadCount || 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    refetch,
    hasMore: (data?.data?.length || 0) >= limit,
    loadMore,
  };
};

/**
 * Hook for managing notification preferences
 */
export const useNotificationPreferences = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const response = await api.get<{ data: NotificationPreferences }>(
        "/notifications/preferences",
      );
      return response.data as NotificationPreferences;
    },
    staleTime: 60000, // 1 minute
  });

  const updateMutation = useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await api.patch<{ data: NotificationPreferences }>(
        "/notifications/preferences",
        preferences,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  return {
    preferences: data,
    isLoading,
    error: error instanceof Error ? error.message : null,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    refetch,
  };
};

/**
 * Hook for unread notification count
 */
export const useUnreadNotificationCount = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const response = await api.get<{ data: { unreadCount: number } }>(
        "/notifications/count/unread",
      );
      return response.data.unreadCount;
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return {
    unreadCount: data || 0,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};

/**
 * Hook for push notification subscription
 */
export const usePushNotifications = () => {
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports service workers and push notifications
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported) {
        throw new Error("Push notifications not supported in this browser");
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission denied");
        }
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      // Send subscription to server
      const response = await api.post<{ data: any }>(
        "/notifications/subscribe",
        { subscription: subscription.toJSON() },
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      await getApi().delete(`/notifications/subscribe/${subscriptionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  return {
    isSupported,
    subscribe: subscribeMutation.mutateAsync,
    unsubscribe: unsubscribeMutation.mutateAsync,
    isSubscribing: subscribeMutation.isPending,
    error: subscribeMutation.error || unsubscribeMutation.error,
  };
};

/**
 * Real-time notification listener using WebSocket
 * (Optional - for real-time updates)
 */
export const useRealtimeNotifications = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(
    null,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize WebSocket connection for real-time notifications
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_URL || "ws://localhost:3001"}/notifications?token=${token}`,
    );

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setLastNotification(notification);

        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    return () => ws.close();
  }, [queryClient]);

  return {
    isConnected,
    lastNotification,
  };
};
