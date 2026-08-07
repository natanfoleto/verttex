import { Pool } from 'pg'
import { describe, expect, it } from 'vitest'

import { validateAndIsolateTestDatabase } from './setup'

describe('ENV-01 — Database Isolation Security Unit & Integration Tests', () => {
  it('1. Ausência de TEST_DATABASE_URL: rejeita quando TEST_DATABASE_URL é inválido ou vazio', async () => {
    const originalTestUrl = process.env.TEST_DATABASE_URL
    process.env.TEST_DATABASE_URL = 'invalid_url_string'

    await expect(validateAndIsolateTestDatabase()).rejects.toThrow(
      'Safety check failed',
    )

    process.env.TEST_DATABASE_URL = originalTestUrl
  })

  it('2. Ambiente diferente de teste: rejeita quando NODE_ENV !== "test"', async () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = 'production'

    await expect(validateAndIsolateTestDatabase()).rejects.toThrow(
      'Safety check failed: NODE_ENV is not "test"',
    )

    ;(process.env as Record<string, string>).NODE_ENV = originalEnv!
  })

  it('4. Nome inseguro: rejeita TEST_DATABASE_URL sem marcador test ou testing', async () => {
    const originalTestUrl = process.env.TEST_DATABASE_URL
    process.env.TEST_DATABASE_URL =
      'postgresql://verttex:verttex_dev_password@localhost:5432/production_db?schema=public'

    await expect(validateAndIsolateTestDatabase()).rejects.toThrow(
      'must contain a "test" or "testing" marker',
    )

    process.env.TEST_DATABASE_URL = originalTestUrl
  })

  it('3. Banco realmente conectado: altera DATABASE_URL para TEST_DATABASE_URL e preserva banco A intacto', async () => {
    const dbAUrl =
      'postgresql://verttex:verttex_dev_password@localhost:5432/verttex_test_a?schema=public'
    const dbBUrl =
      'postgresql://verttex:verttex_dev_password@localhost:5432/verttex_test_b?schema=public'

    // Insere registro sentinela no Banco A
    const poolA = new Pool({ connectionString: dbAUrl })
    await poolA.query('TRUNCATE TABLE stores CASCADE;')
    await poolA.query(
      `INSERT INTO stores (id, name, slug, status, "createdAt", "updatedAt") VALUES ('sentinel_store_a', 'Sentinel Store A', 'sentinel-a', 'active', NOW(), NOW());`,
    )

    process.env.DATABASE_URL = dbAUrl
    process.env.TEST_DATABASE_URL = dbBUrl

    // Executa isolamento obrigatorio
    await validateAndIsolateTestDatabase()

    // 1. Confirma que process.env.DATABASE_URL foi redirecionado para dbBUrl (TEST_DATABASE_URL)
    expect(process.env.DATABASE_URL).toBe(dbBUrl)

    // 2. Consulta SELECT current_database() no banco conectado via TEST_DATABASE_URL (Banco B)
    const poolB = new Pool({ connectionString: process.env.DATABASE_URL })
    const resB = await poolB.query('SELECT current_database() as db_name;')
    expect(resB.rows[0]?.db_name).toBe('verttex_test_b')

    // 3. Executa operacao destrutiva no Banco B
    await poolB.query('TRUNCATE TABLE stores CASCADE;')
    await poolB.end()

    // 4. Comprova que o registro sentinela no Banco A permaneceu 100% INTACTO
    const checkA = await poolA.query(
      "SELECT id, name FROM stores WHERE id = 'sentinel_store_a';",
    )
    expect(checkA.rows).toHaveLength(1)
    expect(checkA.rows[0]?.name).toBe('Sentinel Store A')
    await poolA.end()
  })
})
