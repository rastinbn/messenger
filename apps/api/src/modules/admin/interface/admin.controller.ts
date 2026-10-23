import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { AdminService } from "../application/admin.service";

import { AdminConversationListDto } from "./dto/admin-conversation.dto";
import { AdminStatsDto } from "./dto/admin-stats.dto";
import { AdminUserListDto } from "./dto/admin-user.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller({ path: "admin", version: "1" })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  @ApiOperation({ summary: "[Admin] Site-wide stats" })
  @ApiOkResponse({ type: AdminStatsDto })
  async getStats(): Promise<AdminStatsDto> {
    return this.adminService.getStats();
  }

  @Get("users")
  @ApiOperation({ summary: "[Admin] List all users, paginated" })
  @ApiOkResponse({ type: AdminUserListDto })
  async listUsers(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "25",
    @Query("q") query?: string
  ): Promise<AdminUserListDto> {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const { users, total } = await this.adminService.listUsers(pageNum, pageSizeNum, query);
    return { users, total, page: pageNum, pageSize: pageSizeNum };
  }

  @Put("users/:id/suspend")
  @ApiOperation({ summary: "[Admin] Suspend a user (blocks login/API access immediately)" })
  async suspendUser(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string) {
    try {
      const user = await this.adminService.setSuspended(admin.id, id, true);
      return { success: true, suspendedAt: user.suspendedAt };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw err;
    }
  }

  @Put("users/:id/unsuspend")
  @ApiOperation({ summary: "[Admin] Lift a user's suspension" })
  async unsuspendUser(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string) {
    const user = await this.adminService.setSuspended(admin.id, id, false);
    return { success: true, suspendedAt: user.suspendedAt };
  }

  @Put("users/:id/role")
  @ApiOperation({ summary: "[Admin] Change a user's site role" })
  async updateRole(
    @CurrentUser() admin: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateUserRoleDto
  ) {
    const user = await this.adminService.setSiteRole(admin.id, id, dto.role);
    return { success: true, siteRole: user.siteRole };
  }

  @Delete("users/:id")
  @ApiOperation({ summary: "[Admin] Permanently delete a user and all their data" })
  async deleteUser(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string) {
    await this.adminService.deleteUser(admin.id, id);
    return { success: true };
  }

  @Get("conversations")
  @ApiOperation({ summary: "[Admin] List all conversations site-wide, paginated" })
  @ApiOkResponse({ type: AdminConversationListDto })
  async listConversations(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "25"
  ): Promise<AdminConversationListDto> {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 25));
    const { conversations, total } = await this.adminService.listConversations(pageNum, pageSizeNum);
    return { conversations, total, page: pageNum, pageSize: pageSizeNum };
  }

  @Delete("conversations/:id")
  @ApiOperation({ summary: "[Admin] Delete a conversation and all its messages" })
  async deleteConversation(@Param("id") id: string) {
    await this.adminService.deleteConversation(id);
    return { success: true };
  }

  @Delete("messages/:id")
  @ApiOperation({ summary: "[Admin] Delete a single message (moderation)" })
  async deleteMessage(@Param("id") id: string) {
    await this.adminService.deleteMessage(id);
    return { success: true };
  }
}
