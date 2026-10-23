import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";

import { AuthService } from "./application/auth.service";
import { EMAIL_VERIFICATION_REPOSITORY } from "./application/ports/email-verification-repository.port";
import { MAGIC_LINK_REPOSITORY } from "./application/ports/magic-link-repository.port";
import { PASSWORD_HASHER } from "./application/ports/password-hasher.port";
import { REFRESH_TOKEN_REPOSITORY } from "./application/ports/refresh-token-repository.port";
import { TokenService } from "./application/token.service";
import { Argon2PasswordHasher } from "./infrastructure/argon2-password-hasher";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { PrismaEmailVerificationRepository } from "./infrastructure/prisma-email-verification.repository";
import { PrismaMagicLinkRepository } from "./infrastructure/prisma-magic-link.repository";
import { PrismaRefreshTokenRepository } from "./infrastructure/prisma-refresh-token.repository";
import { AuthController } from "./interface/auth.controller";

@Module({
  imports: [
    UsersModule,
    EmailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: { expiresIn: config.get<string>("JWT_ACCESS_TTL", "15m") as never }
      })
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: EMAIL_VERIFICATION_REPOSITORY, useClass: PrismaEmailVerificationRepository },
    { provide: MAGIC_LINK_REPOSITORY, useClass: PrismaMagicLinkRepository }
  ],
  exports: [AuthService]
})
export class AuthModule {}
