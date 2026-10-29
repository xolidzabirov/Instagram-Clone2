import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { FollowsService } from "./follows.service";
import { RelationsService } from "./relations.service";
import { SocialController } from "./social.controller";

@Module({
  imports: [UsersModule],
  controllers: [SocialController],
  providers: [FollowsService, RelationsService],
})
export class SocialModule {}
