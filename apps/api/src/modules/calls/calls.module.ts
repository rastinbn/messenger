import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { ConversationsModule } from "../conversations/conversations.module";

import { CallsController } from "./interface/calls.controller";
import { CallsGateway } from "./interface/ws/calls.gateway";

@Module({
  imports: [
    ConversationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET")
      })
    })
  ],
  controllers: [CallsController],
  providers: [CallsGateway]
})
export class CallsModule {}
