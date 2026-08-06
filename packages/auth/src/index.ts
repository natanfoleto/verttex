import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'

import type { UserToken } from './permissions'
import { buildUserAbilities } from './permissions'
import type { AppAbilities, Subject } from './subjects'

export * from './permissions'
export * from './roles'
export * from './subjects'
export type { UserToken }

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: UserToken): AppAbility {
  const builder = new AbilityBuilder(createAppAbility)

  buildUserAbilities(user, builder)

  const ability = builder.build({
    detectSubjectType(subject: unknown) {
      if (typeof subject === 'string') return subject as Subject
      const obj = subject as { __typename?: string; kind?: string }
      return (obj.__typename || obj.kind || 'all') as Subject
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}
