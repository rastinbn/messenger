import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      // `expiresIn` is typed against `ms`'s template-literal StringValue type,
      // which a generic `string` from ConfigService can't statically satisfy
      // even though the runtime value ("15m", "30d", ...) is valid. Validated
      // at boot by envSchema (config/env.validation.ts) instead.
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as never,
    });
  }

  /** Opaque random token — not a JWT. Kept simple and revocable via its hash in the DB (rotation-friendly, no JWT-blacklist needed). */
  generateRefreshTokenValue(): string {
    return randomBytes(48).toString('hex');
  }

  getRefreshTokenTtlMs(): number {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL', '30d');
    return parseDurationToMs(ttl);
  }

  getAccessTokenExpirySeconds(): number {
    const ttl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    return Math.floor(parseDurationToMs(ttl) / 1000);
  }
}

/** Parses simple "15m" / "30d" / "1h" style durations — avoids pulling in a whole date library for this one need. */
function parseDurationToMs(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input.trim());
  if (!match)
    throw new Error(
      `Invalid duration format: "${input}" (expected e.g. "15m", "30d")`,
    );
  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const unitMs: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * unitMs[unit];
}
