import type { PublicUser } from "@messenger/shared-types";

import { apiFetch } from "@/lib/api/http-client";
import type { ContactsService } from "@/lib/services/types";

export class HttpContactsService implements ContactsService {
  async listContacts(): Promise<PublicUser[]> {
    return apiFetch<PublicUser[]>("/v1/contacts");
  }

  async addContact(userId: string): Promise<void> {
    await apiFetch(`/v1/contacts/${userId}`, { method: "POST" });
  }

  async removeContact(userId: string): Promise<void> {
    await apiFetch(`/v1/contacts/${userId}`, { method: "DELETE" });
  }
}
