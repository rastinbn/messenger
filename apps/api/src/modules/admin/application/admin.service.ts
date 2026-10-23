import { BadRequestException, Injectable } from "@nestjs/common";

import { UsersService } from "../../users/application/users.service";
import type { SiteRole, UserEntity } from "../../users/domain/user.entity";
import { AdminRepository, type AdminConversationRow } from "../infrastructure/admin.repository";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminRepository: AdminRepository
  ) {}

  async listUsers(page: number, pageSize: number, query?: string) {
    return this.usersService.adminListUsers({ page, pageSize, query });
  }

  async setSuspended(actingAdminId: string, targetUserId: string, suspended: boolean): Promise<UserEntity> {
    if (actingAdminId === targetUserId && suspended) {
      throw new BadRequestException("You can't suspend your own account.");
    }
    return this.usersService.setSuspended(targetUserId, suspended);
  }

  async setSiteRole(actingAdminId: string, targetUserId: string, role: SiteRole): Promise<UserEntity> {
    if (actingAdminId === targetUserId && role !== "admin") {
      throw new BadRequestException("You can't remove your own admin access.");
    }
    return this.usersService.setSiteRole(targetUserId, role);
  }

  async deleteUser(actingAdminId: string, targetUserId: string): Promise<void> {
    if (actingAdminId === targetUserId) {
      throw new BadRequestException("You can't delete your own account from the admin panel.");
    }
    await this.usersService.deleteUser(targetUserId);
  }

  async listConversations(
    page: number,
    pageSize: number
  ): Promise<{ conversations: AdminConversationRow[]; total: number }> {
    return this.adminRepository.listConversations({ page, pageSize });
  }

  async deleteConversation(id: string): Promise<void> {
    await this.adminRepository.deleteConversation(id);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.adminRepository.deleteMessage(id);
  }

  async getStats() {
    const now = new Date();
    const since24h = new Date(now.getTime() - ONE_DAY_MS);
    const since7d = new Date(now.getTime() - ONE_WEEK_MS);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      totalConversations,
      totalMessages,
      messagesToday,
      suspendedUsers
    ] = await Promise.all([
      this.usersService.countAll(),
      this.usersService.countCreatedSince(since24h),
      this.usersService.countCreatedSince(since7d),
      this.adminRepository.countConversations(),
      this.adminRepository.countMessages(),
      this.adminRepository.countMessagesSince(since24h),
      this.usersService.countSuspended()
    ]);

    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      totalConversations,
      totalMessages,
      messagesToday,
      suspendedUsers
    };
  }
}
