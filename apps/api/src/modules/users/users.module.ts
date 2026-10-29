import { Module } from "@nestjs/common";
import { PolicyService } from "./policy.service";
import { TargetUsers } from "./target-users";
import { UserPresenter } from "./user.presenter";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UserPresenter, PolicyService, UsersService, TargetUsers],
  exports: [UserPresenter, PolicyService, TargetUsers],
})
export class UsersModule {}
