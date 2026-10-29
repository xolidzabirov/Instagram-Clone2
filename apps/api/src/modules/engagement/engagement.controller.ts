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
  createCollectionSchema,
  paginationSchema,
  savedPostsQuerySchema,
  savePostSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type PaginationInput,
  type SavedPostsQuery,
  type SavePostInput,
  type UpdateCollectionInput,
} from "@ig/shared";
import { CurrentUser, OptionalUser, Public, type AuthContext } from "../../common/auth/auth-context";
import { ZodBody, ZodQuery } from "../../common/validation/zod-decorators";
import { CollectionsService } from "./collections.service";
import { EngagementService } from "./engagement.service";

const uuid = () => new ParseUUIDPipe();

@ApiTags("engagement")
@Controller()
export class EngagementController {
  constructor(
    private readonly engagement: EngagementService,
    private readonly collections: CollectionsService
  ) {}

  // ─── Likes ─────────────────────────────────────────────────────────────────

  @Put("posts/:id/like")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Like (idempotent); returns the new like state" })
  like(@CurrentUser() auth: AuthContext, @Param("id", uuid()) id: string) {
    return this.engagement.like(auth.userId, id);
  }

  @Delete("posts/:id/like")
  @ApiBearerAuth()
  unlike(@CurrentUser() auth: AuthContext, @Param("id", uuid()) id: string) {
    return this.engagement.unlike(auth.userId, id);
  }

  @Get("posts/:id/likes")
  @ApiBearerAuth()
  @ApiOperation({ summary: "People who liked the post" })
  likers(
    @CurrentUser() auth: AuthContext,
    @Param("id", uuid()) id: string,
    @ZodQuery(paginationSchema) page: PaginationInput
  ) {
    return this.engagement.likers(auth.userId, id, page);
  }

  // ─── Saves & collections ───────────────────────────────────────────────────

  @Put("posts/:id/save")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save, or move a saved post into a collection" })
  save(
    @CurrentUser() auth: AuthContext,
    @Param("id", uuid()) id: string,
    @ZodBody(savePostSchema) body: SavePostInput
  ) {
    return this.engagement.save(auth.userId, id, body.collectionId);
  }

  @Delete("posts/:id/save")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  unsave(@CurrentUser() auth: AuthContext, @Param("id", uuid()) id: string) {
    return this.engagement.unsave(auth.userId, id);
  }

  @Get("users/me/saved")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Your saved posts (?collectionId= for one collection)" })
  saved(@CurrentUser() auth: AuthContext, @ZodQuery(savedPostsQuerySchema) query: SavedPostsQuery) {
    return this.engagement.saved(auth.userId, query);
  }

  @Get("collections")
  @ApiBearerAuth()
  listCollections(@CurrentUser() auth: AuthContext) {
    return this.collections.list(auth.userId);
  }

  @Post("collections")
  @ApiBearerAuth()
  createCollection(@CurrentUser() auth: AuthContext, @ZodBody(createCollectionSchema) body: CreateCollectionInput) {
    return this.collections.create(auth.userId, body.name);
  }

  @Patch("collections/:id")
  @ApiBearerAuth()
  renameCollection(
    @CurrentUser() auth: AuthContext,
    @Param("id", uuid()) id: string,
    @ZodBody(updateCollectionSchema) body: UpdateCollectionInput
  ) {
    return this.collections.rename(auth.userId, id, body.name);
  }

  @Delete("collections/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a collection; its posts stay saved" })
  deleteCollection(@CurrentUser() auth: AuthContext, @Param("id", uuid()) id: string) {
    return this.collections.remove(auth.userId, id);
  }

  // ─── Reposts ───────────────────────────────────────────────────────────────

  @Put("posts/:id/repost")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Repost to your profile (public posts of others only)" })
  repost(@CurrentUser() auth: AuthContext, @Param("id", uuid()) id: string) {
    return this.engagement.repost(auth.userId, id);
  }

  @Delete("posts/:id/repost")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  unrepost(@CurrentUser() auth: AuthContext, @Param("id", uuid()) id: string) {
    return this.engagement.unrepost(auth.userId, id);
  }

  @Public()
  @Get("users/:username/reposts")
  @ApiOperation({ summary: "Reposts tab of a profile" })
  reposts(
    @Param("username") username: string,
    @OptionalUser() auth: AuthContext | null,
    @ZodQuery(paginationSchema) page: PaginationInput
  ) {
    return this.engagement.reposts(username, auth?.userId ?? null, page);
  }
}
