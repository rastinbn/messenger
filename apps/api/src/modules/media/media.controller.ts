import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import type { Express } from "express";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";

import { UploadResponseDto } from "./interface/dto/upload-response.dto";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Voice messages — MediaRecorder output varies by browser (opus in webm/ogg,
  // or mp4 on Safari), so all of them have to be accepted.
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a"
]);

@ApiTags("media")
@ApiBearerAuth()
@Controller({ path: "media", version: "1" })
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  @Post("upload")
  @ApiOperation({ summary: "Upload a file/image attachment (returns an attachment id to reference when sending a message)" })
  @ApiConsumes("multipart/form-data")
  @ApiOkResponse({ type: UploadResponseDto })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, process.env.MEDIA_UPLOAD_DIR ?? "./uploads");
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        }
      }),
      limits: {
        fileSize: Number(process.env.MEDIA_MAX_FILE_SIZE_BYTES ?? 10_485_760)
      },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(new BadRequestException(`File type "${file.mimetype}" is not allowed.`), false);
          return;
        }
        cb(null, true);
      }
    })
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File
  ): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException("No file was uploaded.");

    const type = file.mimetype.startsWith("image/") ? "image" : "file";
    const publicUrl = `/uploads/${file.filename}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        uploaderId: user.id,
        type,
        url: publicUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size
      }
    });

    return attachment;
  }

  /**
   * Forces a real download with the original filename, regardless of the
   * requesting origin. The plain static `/uploads/*` route (ServeStaticModule,
   * see app.module.ts) is fine for *displaying* images inline in chat, but
   * browsers only honor an `<a download>` attribute for same-origin URLs —
   * since the frontend (localhost:3000) and this API (localhost:4000) are
   * different origins, that attribute is silently ignored and the browser
   * just navigates to view the file instead of downloading it. Setting
   * Content-Disposition here forces the download regardless of origin.
   */
  @Public()
  @Get(":id/download")
  @ApiOperation({ summary: "Download an attachment with its original filename forced via Content-Disposition" })
  async download(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException("Attachment not found.");

    const uploadDir = this.config.get<string>("MEDIA_UPLOAD_DIR", "./uploads");
    const filePath = join(process.cwd(), uploadDir, attachment.url.replace(/^\/uploads\//, ""));

    if (!existsSync(filePath)) throw new NotFoundException("File no longer exists on disk.");

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
    res.setHeader("Content-Type", attachment.mimeType);
    res.sendFile(filePath);
  }
}
