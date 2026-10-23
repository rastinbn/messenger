import type { PublicUser } from "@messenger/shared-types";

import { CURRENT_USER_ID, FIXTURE_USERS, toPublicUser } from "@/lib/fixtures/users";
import type { ContactsService } from "@/lib/services/types";

import { delay } from "./util";

// Seed: everyone except the current user starts as a contact.
const contactIds = new Set(FIXTURE_USERS.filter((u) => u.id !== CURRENT_USER_ID).map((u) => u.id));

export class MockContactsService implements ContactsService {
  async listContacts(): Promise<PublicUser[]> {
    await delay();
    return FIXTURE_USERS.filter((u) => contactIds.has(u.id)).map(toPublicUser);
  }

  async addContact(userId: string): Promise<void> {
    await delay(250);
    contactIds.add(userId);
  }

  async removeContact(userId: string): Promise<void> {
    await delay(250);
    contactIds.delete(userId);
  }
}
