export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Refresh token is invalid, expired, or has already been used.");
    this.name = "InvalidRefreshTokenError";
  }
}

export class InvalidVerificationTokenError extends Error {
  constructor() {
    super("Verification link is invalid, expired, or has already been used.");
    this.name = "InvalidVerificationTokenError";
  }
}

export class InvalidMagicLinkError extends Error {
  constructor() {
    super("Login link is invalid, expired, or has already been used.");
    this.name = "InvalidMagicLinkError";
  }
}
