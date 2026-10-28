import { Controller, Delete, Get, Param, Patch, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  setAvatarSchema,
  updateProfileSchema,
  type CurrentUser as CurrentUserDto,
  type SetAvatarInput,
  type SuggestedUser,
  type UpdateProfileInput,
  type UserProfile,
} from "@ig/shared";
import {
  CurrentUser,
  OptionalUser,
  Public,
  type AuthContext,
} from "../../common/auth/auth-context";
import { ZodBody, ZodQuery } from "../../common/validation/zod-decorators";
import { z } from "zod";
import { UsersService } from "./users.service";

const suggestionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // `me` routes come before `:username`; "me" is also too short to be a username

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "The signed-in user" })
  getMe(@CurrentUser() auth: AuthContext): Promise<CurrentUserDto> {
    return this.users.getMe(auth.userId);
  }

  @Patch("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Edit profile: only the sent fields change" })
  updateMe(
    @CurrentUser() auth: AuthContext,
    @ZodBody(updateProfileSchema) body: UpdateProfileInput
  ): Promise<CurrentUserDto> {
    return this.users.updateMe(auth.userId, body);
  }

  @Put("me/avatar")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set an uploaded AVATAR media as the profile picture" })
  setAvatar(
    @CurrentUser() auth: AuthContext,
    @ZodBody(setAvatarSchema) body: SetAvatarInput
  ): Promise<CurrentUserDto> {
    return this.users.setAvatar(auth.userId, body.mediaId);
  }

  @Delete("me/avatar")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove the profile picture" })
  removeAvatar(@CurrentUser() auth: AuthContext): Promise<CurrentUserDto> {
    return this.users.removeAvatar(auth.userId);
  }

  @Get("suggestions")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Suggested accounts to follow" })
  suggestions(
    @CurrentUser() auth: AuthContext,
    @ZodQuery(suggestionsQuerySchema) query: { limit: number }
  ): Promise<SuggestedUser[]> {
    return this.users.suggestions(auth.userId, query.limit);
  }

  @Public()
  @Get(":username")
  @ApiOperation({ summary: "Public profile; includes the relationship for signed-in callers" })
  getProfile(
    @Param("username") username: string,
    @OptionalUser() auth: AuthContext | null
  ): Promise<UserProfile> {
    return this.users.getProfile(username, auth?.userId ?? null);
  }
}
