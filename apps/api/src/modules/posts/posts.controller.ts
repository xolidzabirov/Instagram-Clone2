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
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  createPostSchema,
  paginationSchema,
  updatePostSchema,
  type CreatePostInput,
  type PaginationInput,
  type UpdatePostInput,
} from "@ig/shared";
import { CurrentUser, OptionalUser, Public, type AuthContext } from "../../common/auth/auth-context";
import { ZodBody, ZodQuery } from "../../common/validation/zod-decorators";
import { PostsService } from "./posts.service";

const postId = () => new ParseUUIDPipe();

@ApiTags("posts")
@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Post("posts")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish a post (1–20 slides) or a reel (one video)" })
  create(@CurrentUser() auth: AuthContext, @ZodBody(createPostSchema) body: CreatePostInput) {
    return this.posts.create(auth.userId, body);
  }

  // Declared before posts/:id so "archived" is not parsed as an id
  @Get("posts/archived")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Your archived posts" })
  archived(@CurrentUser() auth: AuthContext, @ZodQuery(paginationSchema) page: PaginationInput) {
    return this.posts.archived(auth.userId, page);
  }

  @Public()
  @Get("posts/:id")
  @ApiOperation({ summary: "A post, if the viewer may see its author's content" })
  get(@Param("id", postId()) id: string, @OptionalUser() auth: AuthContext | null) {
    return this.posts.get(id, auth?.userId ?? null);
  }

  @Patch("posts/:id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit caption, location, tags, alt texts and settings" })
  update(
    @CurrentUser() auth: AuthContext,
    @Param("id", postId()) id: string,
    @ZodBody(updatePostSchema) body: UpdatePostInput
  ) {
    return this.posts.update(auth.userId, id, body);
  }

  @Delete("posts/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  remove(@CurrentUser() auth: AuthContext, @Param("id", postId()) id: string) {
    return this.posts.remove(auth.userId, id);
  }

  @Post("posts/:id/archive")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  archive(@CurrentUser() auth: AuthContext, @Param("id", postId()) id: string) {
    return this.posts.setArchived(auth.userId, id, true);
  }

  @Delete("posts/:id/archive")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  unarchive(@CurrentUser() auth: AuthContext, @Param("id", postId()) id: string) {
    return this.posts.setArchived(auth.userId, id, false);
  }

  @Post("posts/:id/pin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Pin to the top of your grid (up to 3)" })
  pin(@CurrentUser() auth: AuthContext, @Param("id", postId()) id: string) {
    return this.posts.setPinned(auth.userId, id, true);
  }

  @Delete("posts/:id/pin")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  unpin(@CurrentUser() auth: AuthContext, @Param("id", postId()) id: string) {
    return this.posts.setPinned(auth.userId, id, false);
  }

  @Public()
  @Get("users/:username/posts")
  @ApiOperation({ summary: "Profile grid: posts and reels, pinned first" })
  gridPosts(
    @Param("username") username: string,
    @OptionalUser() auth: AuthContext | null,
    @ZodQuery(paginationSchema) page: PaginationInput
  ) {
    return this.posts.grid(username, "posts", auth?.userId ?? null, page);
  }

  @Public()
  @Get("users/:username/reels")
  gridReels(
    @Param("username") username: string,
    @OptionalUser() auth: AuthContext | null,
    @ZodQuery(paginationSchema) page: PaginationInput
  ) {
    return this.posts.grid(username, "reels", auth?.userId ?? null, page);
  }

  @Public()
  @Get("users/:username/tagged")
  @ApiOperation({ summary: "Posts the user is tagged in (only those the viewer may see)" })
  gridTagged(
    @Param("username") username: string,
    @OptionalUser() auth: AuthContext | null,
    @ZodQuery(paginationSchema) page: PaginationInput
  ) {
    return this.posts.grid(username, "tagged", auth?.userId ?? null, page);
  }
}
