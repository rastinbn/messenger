import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";

import type { AuthenticatedUser } from "../decorators/current-user.decorator";

/**
 * Runs AFTER JwtAuthGuard (so `request.user` is already populated) — apply
 * alongside it, never instead of it, e.g.:
 *   @UseGuards(AdminGuard)
 * on a controller that's already behind the global JwtAuthGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (request.user?.siteRole !== "admin") {
      throw new ForbiddenException("Admin access required.");
    }
    return true;
  }
}
