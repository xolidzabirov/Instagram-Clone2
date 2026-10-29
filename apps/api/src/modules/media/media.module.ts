import { Module } from "@nestjs/common";
import { MediaCleanup } from "./media.cleanup";
import { MediaController } from "./media.controller";
import { MediaProcessor } from "./media.processor";
import { MediaService } from "./media.service";

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaProcessor, MediaCleanup],
  exports: [MediaService],
})
export class MediaModule {}
