import { Body, ConflictException, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { AuthService } from "../application/auth.service";
import {
  InvalidCredentialsError,
  InvalidMagicLinkError,
  InvalidRefreshTokenError,
  InvalidVerificationTokenError
} from "../domain/errors";
import { EmailAlreadyInUseError, UsernameAlreadyInUseError } from "../../users/domain/errors";

import { AuthSessionDto } from "./dto/auth-session.dto";
import { ConsumeMagicLinkDto } from "./dto/consume-magic-link.dto";
import { LoginDto } from "./dto/login.dto";
import { RequestMagicLinkDto } from "./dto/magic-link.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Create a new account (also sends a verification email)" })
  @ApiCreatedResponse({ type: AuthSessionDto })
  async register(@Body() dto: RegisterDto): Promise<AuthSessionDto> {
    try {
      const { user, tokens } = await this.authService.register(dto);
      const { passwordHash: _passwordHash, ...userDto } = user;
      return { user: userDto, ...tokens };
    } catch (err) {
      if (err instanceof EmailAlreadyInUseError || err instanceof UsernameAlreadyInUseError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Log in with email and password" })
  @ApiCreatedResponse({ type: AuthSessionDto })
  async login(@Body() dto: LoginDto): Promise<AuthSessionDto> {
    try {
      const { user, tokens } = await this.authService.login(dto);
      const { passwordHash: _passwordHash, ...userDto } = user;
      return { user: userDto, ...tokens };
    } catch (err) {
      if (err instanceof InvalidCredentialsError) throw new UnauthorizedException(err.message);
      throw err;
    }
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Exchange a refresh token for a new access/refresh token pair" })
  @ApiCreatedResponse({ type: AuthSessionDto })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthSessionDto> {
    try {
      const { user, tokens } = await this.authService.refresh(dto.refreshToken);
      const { passwordHash: _passwordHash, ...userDto } = user;
      return { user: userDto, ...tokens };
    } catch (err) {
      if (err instanceof InvalidRefreshTokenError) throw new UnauthorizedException(err.message);
      throw err;
    }
  }

  @ApiBearerAuth()
  @Post("logout")
  @ApiOperation({ summary: "Revoke the presented refresh token" })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @ApiBearerAuth()
  @Post("logout-all")
  @ApiOperation({ summary: "Revoke every refresh token for the current user (all devices)" })
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<{ success: true }> {
    await this.authService.logoutAllSessions(user.id);
    return { success: true };
  }

  // --- Email verification -----------------------------------------------

  @ApiBearerAuth()
  @Post("verify-email/resend")
  @ApiOperation({ summary: "Resend the verification email to the current user" })
  async resendVerificationEmail(@CurrentUser() user: AuthenticatedUser): Promise<{ success: true }> {
    await this.authService.resendVerificationEmail(user.id);
    return { success: true };
  }

  @Public()
  @Post("verify-email/confirm")
  @ApiOperation({ summary: "Confirm an email address using the token from the verification email" })
  async confirmEmailVerification(@Body() dto: VerifyEmailDto): Promise<{ success: true }> {
    try {
      await this.authService.confirmEmailVerification(dto.token);
      return { success: true };
    } catch (err) {
      if (err instanceof InvalidVerificationTokenError) throw new UnauthorizedException(err.message);
      throw err;
    }
  }

  // --- Magic link login ----------------------------------------------------

  @Public()
  @Post("magic-link/request")
  @ApiOperation({ summary: "Send a one-time login link to an email address, if an account exists for it" })
  async requestMagicLink(@Body() dto: RequestMagicLinkDto): Promise<{ success: true }> {
    await this.authService.requestMagicLink(dto.email);
    // Always returns success — see AuthService.requestMagicLink for why
    // (avoids leaking which emails have accounts).
    return { success: true };
  }

  @Public()
  @Post("magic-link/consume")
  @ApiOperation({ summary: "Exchange a magic link token for a real session" })
  @ApiCreatedResponse({ type: AuthSessionDto })
  async consumeMagicLink(@Body() dto: ConsumeMagicLinkDto): Promise<AuthSessionDto> {
    try {
      const { user, tokens } = await this.authService.consumeMagicLink(dto.token);
      const { passwordHash: _passwordHash, ...userDto } = user;
      return { user: userDto, ...tokens };
    } catch (err) {
      if (err instanceof InvalidMagicLinkError) throw new UnauthorizedException(err.message);
      throw err;
    }
  }
}
