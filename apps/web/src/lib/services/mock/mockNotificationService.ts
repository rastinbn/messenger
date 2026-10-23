import type { Notification } from "@messenger/shared-types";

import { FIXTURE_NOTIFICATIONS } from "@/lib/fixtures/notifications";
import type { NotificationService } from "@/lib/services/types";

import { delay } from "./util";

const notifications = FIXTURE_NOTIFICATIONS.map((n) => ({ ...n }));
const listeners = new Set<(n: Notification) => void>();

export class MockNotificationService implements NotificationService {
  async listNotifications(): Promise<Notification[]> {
    await delay();
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markAllRead(): Promise<void> {
    await delay(150);
    notifications.forEach((n) => (n.read = true));
  }

  async markRead(id: string): Promise<void> {
    await delay(100);
    const n = notifications.find((n) => n.id === id);
    if (n) n.read = true;
  }

  onNotification(cb: (n: Notification) => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }
}
