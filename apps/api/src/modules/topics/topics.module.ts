import { Module } from "@nestjs/common";
import { PostsModule } from "../posts/posts.module";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";

@Module({
  imports: [PostsModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
