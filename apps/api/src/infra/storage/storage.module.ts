import { Global, Module } from "@nestjs/common";
import { LocalStorageDriver } from "./local-storage.driver";
import { MediaUrlService } from "./media-url.service";
import { StorageDriver } from "./storage.driver";

@Global()
@Module({
  providers: [
    MediaUrlService,
    LocalStorageDriver,
    // STORAGE_DRIVER=local is the only driver for now; an S3 driver is added with Docker/MinIO
    { provide: StorageDriver, useExisting: LocalStorageDriver },
  ],
  exports: [MediaUrlService, StorageDriver, LocalStorageDriver],
})
export class StorageModule {}
