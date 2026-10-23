import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "node:path";

import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { PresenceModule } from "./modules/presence/presence.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { MediaModule } from "./modules/media/media.module";
import { HealthModule } from "./modules/health/health.module";
import { EmailModule } from "./modules/email/email.module";
import { CallsModule } from "./modules/calls/calls.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }]
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.MEDIA_UPLOAD_DIR ?? "./uploads"),
      serveRoot: "/uploads"
    }),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    ConversationsModule,
    MessagingModule,
    PresenceModule,
    NotificationsModule,
    MediaModule,
    CallsModule,
    AdminModule,
    HealthModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter }
  ]
})
export class AppModule {}
