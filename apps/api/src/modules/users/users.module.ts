import { Module } from '@nestjs/common';

import { UsersService } from './application/users.service';
import { USER_REPOSITORY } from './application/ports/user-repository.port';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UsersController } from './interface/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
