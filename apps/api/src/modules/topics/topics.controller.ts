import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { topicWeightSchema, type TopicWeightInput } from "@ig/shared";
import { CurrentUser, Public, type AuthContext } from "../../common/auth/auth-context";
import { ZodBody } from "../../common/validation/zod-decorators";
import { TopicsService } from "./topics.service";

@ApiTags("topics")
@Controller()
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}

  @Public()
  @Get("topics")
  @ApiOperation({ summary: "All interest topics" })
  all() {
    return this.topics.all();
  }

  @Get("topics/me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "«Ваш алгоритм»: your topics and their weights" })
  mine(@CurrentUser() auth: AuthContext) {
    return this.topics.mine(auth.userId);
  }

  @Put("topics/me/:topicId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Show more (weight > 0) or less (< 0) of a topic" })
  set(
    @CurrentUser() auth: AuthContext,
    @Param("topicId", new ParseUUIDPipe()) topicId: string,
    @ZodBody(topicWeightSchema) body: TopicWeightInput
  ) {
    return this.topics.set(auth.userId, topicId, body.weight);
  }

  @Delete("topics/me/:topicId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reset a topic to neutral" })
  reset(@CurrentUser() auth: AuthContext, @Param("topicId", new ParseUUIDPipe()) topicId: string) {
    return this.topics.reset(auth.userId, topicId);
  }

  @Post("posts/:id/not-interested")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Hide the post from your feed and show fewer posts like it" })
  notInterested(@CurrentUser() auth: AuthContext, @Param("id", new ParseUUIDPipe()) postId: string) {
    return this.topics.notInterested(auth.userId, postId);
  }
}
