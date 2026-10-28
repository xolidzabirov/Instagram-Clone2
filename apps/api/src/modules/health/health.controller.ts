import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../../common/auth/auth-context";
import { AppError } from "../../common/errors/app-error";
import { PrismaService } from "../../infra/prisma/prisma.service";

@ApiTags("health")
@Public()
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Liveness and readiness check" })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new AppError(
        "SERVICE_UNAVAILABLE",
        "Database is unreachable",
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return { status: "ok", database: "up", uptime: Math.round(process.uptime()) };
  }
}
