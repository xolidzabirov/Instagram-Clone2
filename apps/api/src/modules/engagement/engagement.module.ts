import { Module } from "@nestjs/common";
import { PostsModule } from "../posts/posts.module";
import { UsersModule } from "../users/users.module";
import { CollectionsService } from "./collections.service";
import { EngagementController } from "./engagement.controller";
import { EngagementService } from "./engagement.service";

@Module({
  imports: [PostsModule, UsersModule],
  controllers: [EngagementController],
  providers: [EngagementService, CollectionsService],
})
export class EngagementModule {}
