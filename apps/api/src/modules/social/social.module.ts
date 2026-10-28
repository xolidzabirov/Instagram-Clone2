import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { FollowsService } from "./follows.service";
import { RelationsService } from "./relations.service";
import { SocialController } from "./social.controller";
import { TargetUsers } from "./target-users";

@Module({
  imports: [UsersModule],
  controllers: [SocialController],
  providers: [FollowsService, RelationsService, TargetUsers],
})
export class SocialModule {}
