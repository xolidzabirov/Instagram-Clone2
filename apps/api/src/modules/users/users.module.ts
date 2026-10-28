import { Module } from "@nestjs/common";
import { PolicyService } from "./policy.service";
import { UserPresenter } from "./user.presenter";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UserPresenter, PolicyService, UsersService],
  exports: [UserPresenter, PolicyService],
})
export class UsersModule {}
