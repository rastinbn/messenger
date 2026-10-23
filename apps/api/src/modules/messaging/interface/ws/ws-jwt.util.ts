import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

import type { AccessTokenPayload } from '../../../auth/application/token.service';

const logger = new Logger('WsAuth');

/**
 * Extracts and verifies the access token from a Socket.IO handshake. The
 * client sends it as `auth: { token }` on connection (see docs/socket-protocol.md).
 * Returns null (never throws) so callers can decide how to fail the connection.
 */
export function extractHandshakeToken(socket: Socket): string | null {
  const fromAuth = socket.handshake.auth?.token as string | undefined;
  const fromHeader = socket.handshake.headers?.authorization?.replace(
    /^Bearer\s+/i,
    '',
  );
  return fromAuth ?? fromHeader ?? null;
}

export function verifyAccessToken(
  jwtService: JwtService,
  token: string,
  secret: string,
): AccessTokenPayload | null {
  try {
    return jwtService.verify<AccessTokenPayload>(token, { secret });
  } catch (err) {
    logger.debug(`WS token verification failed: ${(err as Error).message}`);
    return null;
  }
}
