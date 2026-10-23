import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  siteRole: "user" | "admin";
}

/** Pulls the authenticated user attached by JwtAuthGuard/JwtStrategy onto the request. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
  return request.user;
});
