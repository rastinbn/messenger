import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../../users/application/ports/user-repository.port';
import { UsersService } from '../../users/application/users.service';
import type { UserEntity } from '../../users/domain/user.entity';
import { EmailAlreadyInUseError } from '../../users/domain/errors';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/errors';

import { AuthService } from './auth.service';
import {
  PASSWORD_HASHER,
  type PasswordHasherPort,
} from './ports/password-hasher.port';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
  type StoredRefreshToken,
} from './ports/refresh-token-repository.port';
import { TokenService } from './token.service';

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'hashed:correct-password',
    displayName: 'Alice',
    avatarUrl: null,
    status: 'offline',
    statusMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** In-memory fake implementing the same port a Prisma repository would — no DB needed. */
class FakeUserRepository implements UserRepositoryPort {
  users: UserEntity[] = [];

  async create(data: Parameters<UserRepositoryPort['create']>[0]) {
    const user = makeUser({ id: `user-${this.users.length + 1}`, ...data });
    this.users.push(user);
    return user;
  }
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findByUsername(username: string) {
    return this.users.find((u) => u.username === username) ?? null;
  }
  async updateProfile(id: string, patch: Partial<UserEntity>) {
    const user = this.users.find((u) => u.id === id)!;
    Object.assign(user, patch);
    return user;
  }
  async updateStatus(id: string, status: UserEntity['status']) {
    const user = this.users.find((u) => u.id === id)!;
    user.status = status;
    return user;
  }
  async search() {
    return [];
  }
}

/** Fake password hasher: "correct-password" always verifies against any hash prefixed "hashed:". */
class FakePasswordHasher implements PasswordHasherPort {
  async hash(plainText: string) {
    return `hashed:${plainText}`;
  }
  async verify(hash: string, plainText: string) {
    return hash === `hashed:${plainText}`;
  }
}

class FakeRefreshTokenRepository implements RefreshTokenRepositoryPort {
  tokens: StoredRefreshToken[] = [];

  async create(userId: string, tokenHash: string, expiresAt: Date) {
    const token: StoredRefreshToken = {
      id: `rt-${this.tokens.length + 1}`,
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
    };
    this.tokens.push(token);
    return token;
  }
  async findByHash(tokenHash: string) {
    return this.tokens.find((t) => t.tokenHash === tokenHash) ?? null;
  }
  async revoke(id: string) {
    const token = this.tokens.find((t) => t.id === id);
    if (token) token.revokedAt = new Date();
  }
  async revokeAllForUser(userId: string) {
    this.tokens
      .filter((t) => t.userId === userId)
      .forEach((t) => (t.revokedAt = new Date()));
  }
}

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: FakeUserRepository;
  let refreshTokenRepository: FakeRefreshTokenRepository;

  beforeEach(async () => {
    userRepository = new FakeUserRepository();
    refreshTokenRepository = new FakeRefreshTokenRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_ACCESS_SECRET: 'test-access-secret-at-least-16-chars',
              JWT_ACCESS_TTL: '15m',
              JWT_REFRESH_TTL: '30d',
            }),
          ],
        }),
        JwtModule.register({ secret: 'test-access-secret-at-least-16-chars' }),
      ],
      providers: [
        AuthService,
        TokenService,
        UsersService,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: PASSWORD_HASHER, useClass: FakePasswordHasher },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: refreshTokenRepository },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('creates a user and issues a token pair', async () => {
      const { user, tokens } = await authService.register({
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice',
        password: 'correct-password',
      });

      expect(user.email).toBe('alice@example.com');
      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
      expect(refreshTokenRepository.tokens).toHaveLength(1);
    });

    it('rejects a duplicate email', async () => {
      await authService.register({
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice',
        password: 'correct-password',
      });

      await expect(
        authService.register({
          email: 'alice@example.com',
          username: 'someone-else',
          displayName: 'Someone Else',
          password: 'correct-password',
        }),
      ).rejects.toThrow(EmailAlreadyInUseError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice',
        password: 'correct-password',
      });
    });

    it('succeeds with correct credentials', async () => {
      const { user } = await authService.login({
        email: 'alice@example.com',
        password: 'correct-password',
      });
      expect(user.email).toBe('alice@example.com');
    });

    it('rejects an incorrect password', async () => {
      await expect(
        authService.login({
          email: 'alice@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('rejects an unknown email', async () => {
      await expect(
        authService.login({
          email: 'nobody@example.com',
          password: 'correct-password',
        }),
      ).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token — old token becomes unusable, new one works', async () => {
      const { tokens } = await authService.register({
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice',
        password: 'correct-password',
      });

      const { tokens: rotated } = await authService.refresh(
        tokens.refreshToken,
      );
      expect(rotated.refreshToken).not.toEqual(tokens.refreshToken);

      // The original refresh token must now be rejected (single-use / rotation).
      await expect(authService.refresh(tokens.refreshToken)).rejects.toThrow(
        InvalidRefreshTokenError,
      );

      // But the newly issued one still works.
      await expect(
        authService.refresh(rotated.refreshToken),
      ).resolves.toBeDefined();
    });

    it('rejects a garbage token', async () => {
      await expect(authService.refresh('not-a-real-token')).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });
  });

  describe('logout', () => {
    it('revokes the presented refresh token so it can no longer be used', async () => {
      const { tokens } = await authService.register({
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice',
        password: 'correct-password',
      });

      await authService.logout(tokens.refreshToken);

      await expect(authService.refresh(tokens.refreshToken)).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });
  });
});
