import type { Services } from "@/lib/services/types";

import { HttpAuthService } from "./httpAuthService";
import { HttpChatService } from "./httpChatService";
import { HttpContactsService } from "./httpContactsService";
import { HttpNotificationService } from "./httpNotificationService";
import { HttpUserService } from "./httpUserService";

export const httpServices: Services = {
  auth: new HttpAuthService(),
  user: new HttpUserService(),
  contacts: new HttpContactsService(),
  chat: new HttpChatService(),
  notifications: new HttpNotificationService()
};
