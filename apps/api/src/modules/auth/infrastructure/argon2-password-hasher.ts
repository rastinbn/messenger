import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import type { PasswordHasherPort } from '../application/ports/password-hasher.port';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasherPort {
  async hash(plainText: string): Promise<string> {
    return argon2.hash(plainText, { type: argon2.argon2id });
  }

  async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      // Malformed/foreign hash format — treat as a failed verification, not a crash.
      return false;
    }
  }
}
