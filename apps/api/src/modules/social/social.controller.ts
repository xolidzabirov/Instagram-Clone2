import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  paginationSchema,
  relationshipUpdateSchema,
  searchablePaginationSchema,
  type PaginationInput,
  type RelationshipUpdateInput,
  type SearchablePaginationInput,
} from "@ig/shared";
import { CurrentUser, type AuthContext } from "../../common/auth/auth-context";
import { ZodBody, ZodQuery } from "../../common/validation/zod-decorators";
import { FollowsService } from "./follows.service";
import { RelationsService } from "./relations.service";

const userId = () => new ParseUUIDPipe();

@ApiTags("social")
@ApiBearerAuth()
@Controller()
export class SocialController {
  constructor(
    private readonly follows: FollowsService,
    private readonly relations: RelationsService
  ) {}

  // ─── Follows ───────────────────────────────────────────────────────────────

  @Post("users/:id/follow")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Follow (ACCEPTED) or request to follow a private account (PENDING)" })
  follow(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.follows.follow(auth.userId, id);
  }

  @Delete("users/:id/follow")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Unfollow or cancel a follow request" })
  unfollow(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.follows.unfollow(auth.userId, id);
  }

  @Delete("users/:id/follower")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove one of your followers" })
  removeFollower(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.follows.removeFollower(auth.userId, id);
  }

  @Get("users/:username/followers")
  @ApiOperation({ summary: "Followers of a user (?q= to search)" })
  followers(
    @CurrentUser() auth: AuthContext,
    @Param("username") username: string,
    @ZodQuery(searchablePaginationSchema) query: SearchablePaginationInput
  ) {
    return this.follows.followers(username, auth.userId, query);
  }

  @Get("users/:username/following")
  @ApiOperation({ summary: "Accounts a user follows (?q= to search)" })
  following(
    @CurrentUser() auth: AuthContext,
    @Param("username") username: string,
    @ZodQuery(searchablePaginationSchema) query: SearchablePaginationInput
  ) {
    return this.follows.following(username, auth.userId, query);
  }

  @Get("follow-requests")
  @ApiOperation({ summary: "Pending requests to follow you" })
  requests(@CurrentUser() auth: AuthContext, @ZodQuery(paginationSchema) page: PaginationInput) {
    return this.follows.listRequests(auth.userId, page);
  }

  @Post("follow-requests/:userId/accept")
  @HttpCode(HttpStatus.NO_CONTENT)
  accept(@CurrentUser() auth: AuthContext, @Param("userId", userId()) followerId: string) {
    return this.follows.acceptRequest(auth.userId, followerId);
  }

  @Post("follow-requests/:userId/decline")
  @HttpCode(HttpStatus.NO_CONTENT)
  decline(@CurrentUser() auth: AuthContext, @Param("userId", userId()) followerId: string) {
    return this.follows.declineRequest(auth.userId, followerId);
  }

  // ─── Relationship settings ─────────────────────────────────────────────────

  @Patch("users/:id/relationship")
  @ApiOperation({ summary: "Favorite / mute posts / mute stories of someone you follow" })
  updateRelationship(
    @CurrentUser() auth: AuthContext,
    @Param("id", userId()) id: string,
    @ZodBody(relationshipUpdateSchema) body: RelationshipUpdateInput
  ) {
    return this.relations.updateRelationship(auth.userId, id, body);
  }

  @Put("users/:id/block")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Block: removes follows both ways and hides you from them" })
  block(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.relations.block(auth.userId, id);
  }

  @Delete("users/:id/block")
  @HttpCode(HttpStatus.NO_CONTENT)
  unblock(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.relations.unblock(auth.userId, id);
  }

  @Put("users/:id/restrict")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Restrict: their comments on your posts are visible only to them" })
  restrict(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.relations.restrict(auth.userId, id);
  }

  @Delete("users/:id/restrict")
  @HttpCode(HttpStatus.NO_CONTENT)
  unrestrict(@CurrentUser() auth: AuthContext, @Param("id", userId()) id: string) {
    return this.relations.unrestrict(auth.userId, id);
  }

  @Get("close-friends")
  closeFriends(@CurrentUser() auth: AuthContext, @ZodQuery(paginationSchema) page: PaginationInput) {
    return this.relations.closeFriends(auth.userId, page);
  }

  @Put("close-friends/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  addCloseFriend(@CurrentUser() auth: AuthContext, @Param("userId", userId()) id: string) {
    return this.relations.addCloseFriend(auth.userId, id);
  }

  @Delete("close-friends/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCloseFriend(@CurrentUser() auth: AuthContext, @Param("userId", userId()) id: string) {
    return this.relations.removeCloseFriend(auth.userId, id);
  }

  @Get("blocked")
  blocked(@CurrentUser() auth: AuthContext, @ZodQuery(paginationSchema) page: PaginationInput) {
    return this.relations.blocked(auth.userId, page);
  }

  @Get("restricted")
  restricted(@CurrentUser() auth: AuthContext, @ZodQuery(paginationSchema) page: PaginationInput) {
    return this.relations.restricted(auth.userId, page);
  }

  @Get("muted")
  muted(@CurrentUser() auth: AuthContext, @ZodQuery(paginationSchema) page: PaginationInput) {
    return this.relations.muted(auth.userId, page);
  }
}
