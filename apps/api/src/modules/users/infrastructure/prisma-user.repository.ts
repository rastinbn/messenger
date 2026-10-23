import { Injectable } from "@nestjs/common";
import type { User as PrismaUser } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import type { SiteRole, UserEntity } from "../domain/user.entity";
import type {
  AdminListUsersParams,
  AdminListUsersResult,
  CreateUserData,
  UpdateUserProfileData,
  UserRepositoryPort
} from "../application/ports/user-repository.port";

function toEntity(row: PrismaUser): UserEntity {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.passwordHash,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    status: row.status,
    statusMessage: row.statusMessage,
    emailVerifiedAt: row.emailVerifiedAt,
    siteRole: row.siteRole,
    suspendedAt: row.suspendedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    const row = await this.prisma.user.create({ data });
    return toEntity(row);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toEntity(row) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { username } });
    return row ? toEntity(row) : null;
  }

  async updateProfile(id: string, patch: UpdateUserProfileData): Promise<UserEntity> {
    const row = await this.prisma.user.update({ where: { id }, data: patch });
    return toEntity(row);
  }

  async updateStatus(id: string, status: UserEntity["status"]): Promise<UserEntity> {
    const row = await this.prisma.user.update({ where: { id }, data: { status } });
    return toEntity(row);
  }

  async markEmailVerified(id: string): Promise<UserEntity> {
    const row = await this.prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
    return toEntity(row);
  }

  async search(query: string, excludeUserId: string, limit = 20): Promise<UserEntity[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } }
        ]
      },
      take: limit,
      orderBy: { displayName: "asc" }
    });
    return rows.map(toEntity);
  }

  // --- Admin -----------------------------------------------------------------

  async adminListUsers(params: AdminListUsersParams): Promise<AdminListUsersResult> {
    const where = params.query
      ? {
          OR: [
            { displayName: { contains: params.query, mode: "insensitive" as const } },
            { username: { contains: params.query, mode: "insensitive" as const } },
            { email: { contains: params.query, mode: "insensitive" as const } }
          ]
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize
      }),
      this.prisma.user.count({ where })
    ]);

    return { users: rows.map(toEntity), total };
  }

  async setSuspended(id: string, suspended: boolean): Promise<UserEntity> {
    const row = await this.prisma.user.update({
      where: { id },
      data: { suspendedAt: suspended ? new Date() : null }
    });
    return toEntity(row);
  }

  async setSiteRole(id: string, role: SiteRole): Promise<UserEntity> {
    const row = await this.prisma.user.update({ where: { id }, data: { siteRole: role } });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async countAll(): Promise<number> {
    return this.prisma.user.count();
  }

  async countCreatedSince(since: Date): Promise<number> {
    return this.prisma.user.count({ where: { createdAt: { gte: since } } });
  }

  async countSuspended(): Promise<number> {
    return this.prisma.user.count({ where: { suspendedAt: { not: null } } });
  }
}
