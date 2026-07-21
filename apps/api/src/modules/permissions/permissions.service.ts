import { prisma } from "../../infrastructure/database/prisma";
import { PermissionQuery } from "./permissions.schemas";

export class PermissionsService {
  async listPermissions(query?: PermissionQuery) {
    const where = query?.module ? { module: query.module } : {};

    return prisma.permission.findMany({
      where,
      orderBy: [{ module: "asc" }, { key: "asc" }],
    });
  }
}
