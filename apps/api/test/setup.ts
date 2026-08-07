import '@verttex/env/api'

import { assertSafeLocalDatabaseUrl } from './db-guard'

// Automatically run local database safety check during Vitest setup phase
assertSafeLocalDatabaseUrl()
