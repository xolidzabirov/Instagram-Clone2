import { Module } from "@nestjs/common";
import { PostsModule } from "../posts/posts.module";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";
import { PostScoring } from "./post-scoring";

@Module({
  imports: [PostsModule],
  controllers: [FeedController],
  providers: [FeedService, PostScoring],
  exports: [PostScoring],
})
export class FeedModule {}
