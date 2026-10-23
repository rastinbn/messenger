import type { Notification } from "@messenger/shared-types";

import { apiFetch } from "@/lib/api/http-client";
import type { NotificationService } from "@/lib/services/types";

export class HttpNotificationService implements NotificationService {
  private listeners = new Set<(n: Notification) => void>();

  async listNotifications(): Promise<Notification[]> {
    return apiFetch<Notification[]>("/v1/notifications");
  }

  async markAllRead(): Promise<void> {
    await apiFetch("/v1/notifications/read-all", { method: "PUT" });
  }

  async markRead(id: string): Promise<void> {
    await apiFetch(`/v1/notifications/${id}/read`, { method: "PUT" });
  }

  onNotification(cb: (n: Notification) => void): () => void {
    // Realtime notification push (over the same socket messaging uses) is a
    // documented follow-up — the API currently only persists notifications,
    // it doesn't emit a dedicated socket event for them yet (see
    // docs/socket-protocol.md). For now, the frontend's existing
    // refetchInterval polling on useNotifications covers this gap.
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
