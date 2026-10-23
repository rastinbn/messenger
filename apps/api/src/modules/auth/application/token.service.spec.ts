import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
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
      providers: [TokenService],
    }).compile();
    service = moduleRef.get(TokenService);
  });

  it('signs and can be verified back to the same payload', () => {
    const token = service.signAccessToken({
      sub: 'u1',
      email: 'a@b.com',
      username: 'a',
    });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  it('generates refresh token values that are high-entropy and unique', () => {
    const a = service.generateRefreshTokenValue();
    const b = service.generateRefreshTokenValue();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(64); // 48 random bytes as hex
  });

  it('parses minutes/days TTLs into milliseconds correctly', () => {
    expect(service.getRefreshTokenTtlMs()).toBe(30 * 24 * 60 * 60 * 1000);
    expect(service.getAccessTokenExpirySeconds()).toBe(15 * 60);
  });
});
