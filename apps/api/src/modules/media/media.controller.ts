import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { createUploadSchema, type CreateUploadInput, type MediaInfo, type MediaUpload } from "@ig/shared";
import type { Request } from "express";
import { CurrentUser, type AuthContext } from "../../common/auth/auth-context";
import { ZodBody } from "../../common/validation/zod-decorators";
import { MediaService } from "./media.service";

@ApiTags("media")
@ApiBearerAuth()
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("uploads")
  @ApiOperation({ summary: "Start an upload: returns where to PUT the file" })
  createUpload(
    @CurrentUser() auth: AuthContext,
    @ZodBody(createUploadSchema) body: CreateUploadInput
  ): Promise<MediaUpload> {
    return this.media.createUpload(auth.userId, body);
  }

  @Put(":id/upload")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Upload the file body (local storage driver)" })
  upload(
    @CurrentUser() auth: AuthContext,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() req: Request
  ): Promise<void> {
    // The raw request stream is written straight to storage, never buffered in memory
    return this.media.receiveUpload(auth.userId, id, req);
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Finish the upload and start processing" })
  complete(
    @CurrentUser() auth: AuthContext,
    @Param("id", new ParseUUIDPipe()) id: string
  ): Promise<MediaInfo> {
    return this.media.complete(auth.userId, id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Processing status and URLs of your media" })
  get(@CurrentUser() auth: AuthContext, @Param("id", new ParseUUIDPipe()) id: string): Promise<MediaInfo> {
    return this.media.get(auth.userId, id);
  }
}
