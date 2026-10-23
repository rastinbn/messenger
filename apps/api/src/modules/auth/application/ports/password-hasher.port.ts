export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasherPort {
  hash(plainText: string): Promise<string>;
  verify(hash: string, plainText: string): Promise<boolean>;
}
