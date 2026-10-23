import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";

import { AdminService } from "./application/admin.service";
import { AdminRepository } from "./infrastructure/admin.repository";
import { AdminController } from "./interface/admin.controller";

@Module({
  imports: [UsersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository]
})
export class AdminModule {}
