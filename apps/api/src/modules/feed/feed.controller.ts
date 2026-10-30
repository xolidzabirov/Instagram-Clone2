import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { feedQuerySchema, type FeedItem, type FeedQuery, type Paginated } from "@ig/shared";
import { CurrentUser, type AuthContext } from "../../common/auth/auth-context";
import { ZodQuery } from "../../common/validation/zod-decorators";
import { FeedService } from "./feed.service";

@ApiTags("feed")
@ApiBearerAuth()
@Controller("feed")
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get()
  @ApiOperation({ summary: "home: following + suggestions; following / favorites: chronological" })
  get(@CurrentUser() auth: AuthContext, @ZodQuery(feedQuerySchema) query: FeedQuery): Promise<Paginated<FeedItem>> {
    return this.feed.feed(auth.userId, query);
  }
}
