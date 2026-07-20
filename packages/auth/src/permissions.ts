import { AbilityBuilder } from "@casl/ability";

import { AppAbility } from ".";
import { Role } from "./roles";

export interface UserToken {
  id: string;
  role: Role;
}

type PermissionsByRole = (
  user: UserToken,
  builder: AbilityBuilder<AppAbility>,
) => void;

export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN(_user, { can }) {
    can("manage", "all");
  },
  USER(user, { can }) {
    can("get", "User");
    // Placeholder dynamic permission check:
    can("update", "User", { id: { $eq: user.id } } as any);
  },
};
