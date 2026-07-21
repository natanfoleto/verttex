import {
  AbilityBuilder,
  CreateAbility,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability'

import { buildUserAbilities } from './permissions'
import type { UserToken } from './permissions'
import type { AppAbilities } from './subjects'

export * from './roles'
export * from './permissions'
export * from './subjects'
export type { UserToken }

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: UserToken): AppAbility {
  const builder = new AbilityBuilder(createAppAbility)

  buildUserAbilities(user, builder)

  const ability = builder.build({
    detectSubjectType(subject: any) {
      if (typeof subject === 'string') return subject
      return subject.__typename || subject.kind
    },
  })

  ability.can = ability.can.bind(ability)
  ability.cannot = ability.cannot.bind(ability)

  return ability
}
