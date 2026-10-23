import type { PublicUserEntity } from "../../../users/domain/user.entity";

export const CONTACTS_REPOSITORY = Symbol("CONTACTS_REPOSITORY");

export interface ContactsRepositoryPort {
  listForUser(userId: string): Promise<PublicUserEntity[]>;
  add(userId: string, contactUserId: string): Promise<void>;
  remove(userId: string, contactUserId: string): Promise<void>;
}
