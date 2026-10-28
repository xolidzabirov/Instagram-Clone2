import { Module } from "@nestjs/common";
import { UserPresenter } from "./user.presenter";

@Module({
  providers: [UserPresenter],
  exports: [UserPresenter],
})
export class UsersModule {}
