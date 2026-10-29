import { HttpStatus, Injectable } from "@nestjs/common";
import type { Collection } from "@ig/shared";
import { AppError } from "../../common/errors/app-error";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PostPresenter, postPreviewInclude } from "../posts/post.presenter";
import { publishedPostWhere, visibleAuthorWhere } from "../posts/post-visibility";
import { EngagementService } from "./engagement.service";

const nameTaken = () => new AppError("COLLECTION_EXISTS", "Подборка с таким названием уже есть", HttpStatus.CONFLICT);

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenter: PostPresenter,
    private readonly engagement: EngagementService
  ) {}

  async list(userId: string): Promise<Collection[]> {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(collections.map((collection) => this.present(userId, collection)));
  }

  async create(userId: string, name: string): Promise<Collection> {
    await this.assertNameFree(userId, name);
    const collection = await this.prisma.collection.create({ data: { userId, name } });
    return this.present(userId, collection);
  }

  async rename(userId: string, collectionId: string, name: string): Promise<Collection> {
    await this.engagement.assertOwnCollection(userId, collectionId);
    await this.assertNameFree(userId, name, collectionId);
    const collection = await this.prisma.collection.update({ where: { id: collectionId }, data: { name } });
    return this.present(userId, collection);
  }

  /** Posts stay saved; they only leave the collection */
  async remove(userId: string, collectionId: string): Promise<void> {
    await this.engagement.assertOwnCollection(userId, collectionId);
    await this.prisma.collection.delete({ where: { id: collectionId } });
  }

  private async assertNameFree(userId: string, name: string, exceptId?: string) {
    const existing = await this.prisma.collection.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" }, ...(exceptId && { id: { not: exceptId } }) },
      select: { id: true },
    });
    if (existing) throw nameTaken();
  }

  private async present(
    userId: string,
    collection: { id: string; name: string; createdAt: Date }
  ): Promise<Collection> {
    const visible = { collectionId: collection.id, post: { ...publishedPostWhere, author: visibleAuthorWhere(userId) } };
    const [postsCount, latest] = await Promise.all([
      this.prisma.savedPost.count({ where: visible }),
      this.prisma.savedPost.findFirst({
        where: visible,
        orderBy: { createdAt: "desc" },
        select: { post: { include: postPreviewInclude } },
      }),
    ]);
    return {
      id: collection.id,
      name: collection.name,
      cover: latest ? this.presenter.toPreview(latest.post, userId).thumbnail : null,
      postsCount,
      createdAt: collection.createdAt.toISOString(),
    };
  }
}
