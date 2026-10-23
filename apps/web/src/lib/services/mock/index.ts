import type { Services } from "@/lib/services/types";

import { MockAuthService } from "./mockAuthService";
import { MockChatService } from "./mockChatService";
import { MockContactsService } from "./mockContactsService";
import { MockNotificationService } from "./mockNotificationService";
import { MockUserService } from "./mockUserService";

/**
 * Single mock Services bundle. Phase 2 will introduce a parallel
 * `httpServices` bundle (Http/Socket implementations) and swap which one
 * ServiceProvider passes down — no component code changes required.
 */
export const mockServices: Services = {
  auth: new MockAuthService(),
  user: new MockUserService(),
  contacts: new MockContactsService(),
  chat: new MockChatService(),
  notifications: new MockNotificationService()
};
