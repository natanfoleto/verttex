import { Pool } from 'pg'

export async function validateAndIsolateTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Safety check failed: NODE_ENV is not "test"')
  }

  // Fallback to default clean test database if TEST_DATABASE_URL is not explicitly set in environment
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL =
      'postgresql://verttex:verttex_dev_password@localhost:5432/verttex_test_clean?schema=public'
  }

  const testDbUrl = process.env.TEST_DATABASE_URL

  // Force application DATABASE_URL to use TEST_DATABASE_URL before any Prisma or Env module import
  process.env.DATABASE_URL = testDbUrl

  // Parse database name from TEST_DATABASE_URL
  let dbName = ''
  try {
    const url = new URL(testDbUrl)
    dbName = url.pathname.replace(/^\//, '')
  } catch {
    throw new Error('Safety check failed: TEST_DATABASE_URL is not a valid URL')
  }

  if (!dbName || (!dbName.includes('test') && !dbName.includes('testing'))) {
    throw new Error(
      `Safety check failed: Database name "${dbName}" in TEST_DATABASE_URL must contain a "test" or "testing" marker`,
    )
  }

  // Connect directly with pg Pool to query SELECT current_database()
  const pool = new Pool({ connectionString: testDbUrl })
  try {
    const res = await pool.query('SELECT current_database() as db_name;')
    const currentDb = res.rows[0]?.db_name as string

    if (!currentDb || currentDb !== dbName) {
      throw new Error(
        `Safety check failed: Connected database "${currentDb}" does not match TEST_DATABASE_URL database "${dbName}"`,
      )
    }

    if (!currentDb.includes('test') && !currentDb.includes('testing')) {
      throw new Error(
        `Safety check failed: Real connected database "${currentDb}" does not contain a "test" or "testing" marker`,
      )
    }
  } finally {
    await pool.end()
  }
}

// Automatically run isolation setup during Vitest setup phase
await validateAndIsolateTestDatabase()
