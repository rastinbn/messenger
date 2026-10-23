import type { SiteRole, UserEntity } from "../../domain/user.entity";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
}

export interface UpdateUserProfileData {
  displayName?: string;
  avatarUrl?: string | null;
  statusMessage?: string | null;
}

export interface AdminListUsersParams {
  page: number;
  pageSize: number;
  query?: string;
}

export interface AdminListUsersResult {
  users: UserEntity[];
  total: number;
}

/** Port implemented by infrastructure/prisma-user.repository.ts — application code depends on this, never on Prisma directly. */
export interface UserRepositoryPort {
  create(data: CreateUserData): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  updateProfile(id: string, patch: UpdateUserProfileData): Promise<UserEntity>;
  updateStatus(id: string, status: UserEntity["status"]): Promise<UserEntity>;
  markEmailVerified(id: string): Promise<UserEntity>;
  search(query: string, excludeUserId: string, limit?: number): Promise<UserEntity[]>;

  // --- Admin ---
  adminListUsers(params: AdminListUsersParams): Promise<AdminListUsersResult>;
  setSuspended(id: string, suspended: boolean): Promise<UserEntity>;
  setSiteRole(id: string, role: SiteRole): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  countAll(): Promise<number>;
  countCreatedSince(since: Date): Promise<number>;
  countSuspended(): Promise<number>;
}
