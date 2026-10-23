import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as exempt from the global JwtAuthGuard (e.g. login, register, health check). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
