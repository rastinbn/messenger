import { Inject, Injectable } from "@nestjs/common";

import type { PublicUserEntity } from "../../users/domain/user.entity";

import {
  CONTACTS_REPOSITORY,
  type ContactsRepositoryPort
} from "./ports/contacts-repository.port";

@Injectable()
export class ContactsService {
  constructor(@Inject(CONTACTS_REPOSITORY) private readonly contacts: ContactsRepositoryPort) {}

  async listForUser(userId: string): Promise<PublicUserEntity[]> {
    return this.contacts.listForUser(userId);
  }

  async add(userId: string, contactUserId: string): Promise<void> {
    if (userId === contactUserId) return; // can't add yourself, silently no-op
    await this.contacts.add(userId, contactUserId);
  }

  async remove(userId: string, contactUserId: string): Promise<void> {
    await this.contacts.remove(userId, contactUserId);
  }
}
