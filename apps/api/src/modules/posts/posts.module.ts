import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PostPresenter } from "./post.presenter";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  imports: [UsersModule],
  controllers: [PostsController],
  providers: [PostsService, PostPresenter],
  exports: [PostsService, PostPresenter],
})
export class PostsModule {}
