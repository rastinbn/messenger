import { Inject, Injectable } from "@nestjs/common";
import type { UserStatus } from "@messenger/shared-types";

import { UserNotFoundError } from "../domain/errors";
import { toPublicUser, type PublicUserEntity, type SiteRole, type UserEntity } from "../domain/user.entity";

import {
  USER_REPOSITORY,
  type AdminListUsersParams,
  type AdminListUsersResult,
  type CreateUserData,
  type UpdateUserProfileData,
  type UserRepositoryPort
} from "./ports/user-repository.port";

@Injectable()
export class UsersService {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort) {}

  /** Used only by AuthService during registration — password hashing happens there, not here. */
  async create(data: CreateUserData): Promise<UserEntity> {
    return this.userRepository.create(data);
  }

  async getByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findByUsername(username);
  }

  async getById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async getPublicProfile(id: string): Promise<PublicUserEntity | null> {
    const user = await this.userRepository.findById(id);
    return user ? toPublicUser(user) : null;
  }

  async updateProfile(id: string, patch: UpdateUserProfileData): Promise<UserEntity> {
    return this.userRepository.updateProfile(id, patch);
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserEntity> {
    return this.userRepository.updateStatus(id, status);
  }

  async markEmailVerified(id: string): Promise<UserEntity> {
    return this.userRepository.markEmailVerified(id);
  }

  async search(query: string, excludeUserId: string): Promise<PublicUserEntity[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const users = await this.userRepository.search(trimmed, excludeUserId, 20);
    return users.map(toPublicUser);
  }

  // --- Admin -----------------------------------------------------------------

  async adminListUsers(params: AdminListUsersParams): Promise<AdminListUsersResult> {
    return this.userRepository.adminListUsers(params);
  }

  async setSuspended(id: string, suspended: boolean): Promise<UserEntity> {
    return this.userRepository.setSuspended(id, suspended);
  }

  async setSiteRole(id: string, role: SiteRole): Promise<UserEntity> {
    return this.userRepository.setSiteRole(id, role);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async countAll(): Promise<number> {
    return this.userRepository.countAll();
  }

  async countCreatedSince(since: Date): Promise<number> {
    return this.userRepository.countCreatedSince(since);
  }

  async countSuspended(): Promise<number> {
    return this.userRepository.countSuspended();
  }
}
