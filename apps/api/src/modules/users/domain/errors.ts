export class EmailAlreadyInUseError extends Error {
  constructor(email: string) {
    super(`An account with email "${email}" already exists.`);
    this.name = 'EmailAlreadyInUseError';
  }
}

export class UsernameAlreadyInUseError extends Error {
  constructor(username: string) {
    super(`Username "${username}" is already taken.`);
    this.name = 'UsernameAlreadyInUseError';
  }
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User "${id}" was not found.`);
    this.name = 'UserNotFoundError';
  }
}
