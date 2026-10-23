import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { mkdirSync } from "node:fs";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Ensure the local media upload directory exists before ServeStaticModule/Multer touch it.
  mkdirSync(config.get<string>("MEDIA_UPLOAD_DIR", "./uploads"), { recursive: true });

  app.use(
    helmet({
      // Helmet's default Cross-Origin-Resource-Policy is "same-origin", which
      // blocks the frontend (a different origin/port) from loading anything
      // this API serves — including uploaded images/files under /uploads/*.
      // This is a distinct browser mechanism from CORS (see app.enableCors
      // below); satisfying CORS alone does NOT satisfy CORP, and the
      // failure shows up as net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin with
      // no CORS-looking error at all, which is easy to misdiagnose.
      // "cross-origin" is safe here since this API is designed to be
      // consumed by a separate frontend origin by design, not embedded
      // unexpectedly by third parties in a way CORP was meant to prevent.
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  const corsOrigins = config
    .get<string>("CORS_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Messenger API")
    .setDescription("REST API for the Messenger platform. See docs/socket-protocol.md for the Socket.IO event contract.")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = config.get<number>("PORT", 4000);
  await app.listen(port);
  logger.log(`Messenger API listening on http://localhost:${port}`);
  logger.log(`OpenAPI docs at http://localhost:${port}/docs`);
}

void bootstrap();
