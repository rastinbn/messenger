import { Inject, Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";

import { EmailService } from "../../email/application/email.service";
import { UsersService } from "../../users/application/users.service";
import { EmailAlreadyInUseError, UsernameAlreadyInUseError } from "../../users/domain/errors";
import type { UserEntity } from "../../users/domain/user.entity";
import {
  InvalidCredentialsError,
  InvalidMagicLinkError,
  InvalidRefreshTokenError,
  InvalidVerificationTokenError
} from "../domain/errors";

import {
  EMAIL_VERIFICATION_REPOSITORY,
  type EmailVerificationRepositoryPort
} from "./ports/email-verification-repository.port";
import { MAGIC_LINK_REPOSITORY, type MagicLinkRepositoryPort } from "./ports/magic-link-repository.port";
import { PASSWORD_HASHER, type PasswordHasherPort } from "./ports/password-hasher.port";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort
} from "./ports/refresh-token-repository.port";
import { TokenService } from "./token.service";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15m

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepositoryPort,
    @Inject(EMAIL_VERIFICATION_REPOSITORY)
    private readonly emailVerificationTokens: EmailVerificationRepositoryPort,
    @Inject(MAGIC_LINK_REPOSITORY) private readonly magicLinkTokens: MagicLinkRepositoryPort
  ) {}

  async register(input: RegisterInput): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.usersService.getByEmail(input.email),
      this.usersService.getByUsername(input.username)
    ]);
    if (existingEmail) throw new EmailAlreadyInUseError(input.email);
    if (existingUsername) throw new UsernameAlreadyInUseError(input.username);

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.usersService.create({
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash
    });

    const tokens = await this.issueTokens(user);

    // Fire-and-forget from the caller's perspective, but we still await it
    // here so a failure surfaces in logs immediately rather than silently —
    // a failed verification email should never block account creation, so
    // errors are swallowed after logging, not rethrown.
    await this.sendVerificationEmail(user).catch((err) => {
      this.logger.error(
        `Failed to send verification email to ${user.email}: ${err instanceof Error ? err.message : err}`
      );
    });

    return { user, tokens };
  }

  async login(input: LoginInput): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const user = await this.usersService.getByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    const valid = await this.passwordHasher.verify(user.passwordHash, input.password);
    if (!valid) throw new InvalidCredentialsError();

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(rawRefreshToken: string): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const tokenHash = this.deterministicHash(rawRefreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokens.revoke(stored.id);

    const user = await this.usersService.getById(stored.userId);
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.deterministicHash(rawRefreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (stored) await this.refreshTokens.revoke(stored.id);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.refreshTokens.revokeAllForUser(userId);
  }

  // --- Email verification -----------------------------------------------

  async sendVerificationEmail(user: UserEntity): Promise<void> {
    if (user.emailVerifiedAt) return; // already verified, nothing to do

    const rawToken = this.tokenService.generateRefreshTokenValue();
    const tokenHash = this.deterministicHash(rawToken);
    await this.emailVerificationTokens.create(
      user.id,
      tokenHash,
      new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
    );
    await this.emailService.sendVerificationEmail(user.email, rawToken);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.getById(userId);
    await this.sendVerificationEmail(user);
  }

  async confirmEmailVerification(rawToken: string): Promise<void> {
    const tokenHash = this.deterministicHash(rawToken);
    const stored = await this.emailVerificationTokens.findByHash(tokenHash);

    if (!stored) {
      this.logger.warn(`Email verification failed: no token found matching hash ${tokenHash.slice(0, 12)}…`);
      throw new InvalidVerificationTokenError();
    }
    if (stored.usedAt) {
      this.logger.warn(`Email verification failed: token ${stored.id} was already used at ${stored.usedAt.toISOString()}`);
      throw new InvalidVerificationTokenError();
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      this.logger.warn(`Email verification failed: token ${stored.id} expired at ${stored.expiresAt.toISOString()}`);
      throw new InvalidVerificationTokenError();
    }

    await this.emailVerificationTokens.markUsed(stored.id);
    await this.usersService.markEmailVerified(stored.userId);
    this.logger.log(`Email verified for user ${stored.userId}`);
  }

  // --- Magic link login ----------------------------------------------------

  async requestMagicLink(email: string): Promise<void> {
    const user = await this.usersService.getByEmail(email);
    // Deliberately silent on unknown emails — an error here would let
    // callers enumerate which emails have accounts. Always resolve
    // successfully; only send an email if the account actually exists.
    if (!user) return;

    const rawToken = this.tokenService.generateRefreshTokenValue();
    const tokenHash = this.deterministicHash(rawToken);
    await this.magicLinkTokens.create(user.id, tokenHash, new Date(Date.now() + MAGIC_LINK_TTL_MS));
    await this.emailService.sendMagicLinkEmail(user.email, rawToken);
  }

  async consumeMagicLink(rawToken: string): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const tokenHash = this.deterministicHash(rawToken);
    const stored = await this.magicLinkTokens.findByHash(tokenHash);

    if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new InvalidMagicLinkError();
    }

    await this.magicLinkTokens.markUsed(stored.id);

    const user = await this.usersService.getById(stored.userId);
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  // --- Shared internals -----------------------------------------------------

  private async issueTokens(user: UserEntity): Promise<AuthTokens> {
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      username: user.username
    });

    const rawRefreshToken = this.tokenService.generateRefreshTokenValue();
    const refreshTokenHash = this.deterministicHash(rawRefreshToken);
    const ttlMs = this.tokenService.getRefreshTokenTtlMs();
    await this.refreshTokens.create(user.id, refreshTokenHash, new Date(Date.now() + ttlMs));

    const expiresAt = new Date(Date.now() + this.tokenService.getAccessTokenExpirySeconds() * 1000);

    return { accessToken, refreshToken: rawRefreshToken, expiresAt: expiresAt.toISOString() };
  }

  /**
   * Shared deterministic (SHA-256) hash used for every "random opaque token
   * stored server-side, looked up by equality" case: refresh tokens, email
   * verification tokens, magic link tokens. All are high-entropy random
   * values already, so argon2's slow salted hashing isn't needed — see
   * the longer explanation this method used to carry inline (kept here
   * once instead of repeated per token type).
   */
  private deterministicHash(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }
}
