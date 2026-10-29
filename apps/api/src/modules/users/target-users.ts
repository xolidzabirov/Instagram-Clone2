import { HttpStatus, Injectable } from "@nestjs/common";
import { AppError } from "../../common/errors/app-error";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { PolicyService } from "./policy.service";

const notFound = () => new AppError("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.NOT_FOUND);

/** Looks up the other user of a social action, enforcing that they exist for the viewer */
@Injectable()
export class TargetUsers {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService
  ) {}

  private async active(where: { id: string } | { username: string }) {
    const user = await this.prisma.user.findUnique({
      where,
      select: { id: true, isPrivate: true, status: true, deletedAt: true },
    });
    if (!user || user.status !== "ACTIVE" || user.deletedAt) throw notFound();
    return { id: user.id, isPrivate: user.isPrivate };
  }

  /** The target by id, as long as they have not blocked the viewer */
  async visibleTo(viewerId: string, targetId: string) {
    const target = await this.active({ id: targetId });
    if (await this.policy.isHiddenFrom(viewerId, target.id)) throw notFound();
    return target;
  }

  async byUsername(viewerId: string | null, username: string) {
    const target = await this.active({ username: username.toLowerCase() });
    if (await this.policy.isHiddenFrom(viewerId, target.id)) throw notFound();
    return target;
  }

  /** The target exists at all (blocking works even if they blocked you first) */
  exists(targetId: string) {
    return this.active({ id: targetId });
  }

  /** True when the viewer has blocked the target */
  async hasBlocked(viewerId: string, targetId: string) {
    const block = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: viewerId, blockedId: targetId } },
      select: { blockerId: true },
    });
    return block !== null;
  }
}
