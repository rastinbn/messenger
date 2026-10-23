import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { UsersService } from "../../users/application/users.service";
import type { AccessTokenPayload } from "../application/token.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET")
    });
  }

  /**
   * Return value becomes `request.user` — kept minimal, matching
   * CurrentUser's AuthenticatedUser shape. Also carries siteRole so
   * AdminGuard doesn't need a second DB round trip.
   *
   * Checking suspension here (rather than only at login) means a suspension
   * takes effect on the user's very next request — not after their current
   * access token happens to expire (which could be up to JWT_ACCESS_TTL
   * later, e.g. 15 minutes of continued access after being suspended).
   */
  async validate(payload: AccessTokenPayload) {
    const user = await this.usersService.getById(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException("User no longer exists.");
    if (user.suspendedAt) throw new UnauthorizedException("This account has been suspended.");
    return { id: user.id, email: user.email, username: user.username, siteRole: user.siteRole };
  }
}
