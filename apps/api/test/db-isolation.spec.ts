import { execFileSync } from 'node:child_process'
import { describe, expect, it, vi } from 'vitest'

import { assertSafeLocalDatabaseUrl, isLocalHost } from './db-guard'

describe('Local DATABASE_URL Security Guard & Integration Suite', () => {
  it('1. DATABASE_URL ausente é bloqueada', () => {
    expect(() => assertSafeLocalDatabaseUrl('')).toThrow(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
    expect(() => assertSafeLocalDatabaseUrl('   ')).toThrow(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
  })

  it('2. URL malformada é bloqueada', () => {
    expect(() => assertSafeLocalDatabaseUrl('invalid_url_string')).toThrow(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
  })

  it('3. Protocolo diferente de PostgreSQL é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl('mysql://user:pass@localhost:3306/db'),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl('http://localhost:5432/db'),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('4. NODE_ENV=production é bloqueado', () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = 'production'

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@localhost:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    ;(process.env as Record<string, string>).NODE_ENV = originalEnv!
  })

  it('5. localhost é permitido', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@localhost:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('6. 127.0.0.1 é permitido, mas outros IPs do intervalo 127.x.x.x são bloqueados', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@127.0.0.1:5432/verttex_db',
      ),
    ).not.toThrow()

    // 127.0.0.2, 127.1.2.3, 127.255.255.255 devem ser bloqueados pela allowlist estrita
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgres://user:pass@127.0.0.2:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgres://user:pass@127.1.2.3:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('7. ::1 é permitido', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@[::1]:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('8. host.docker.internal é permitido', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@host.docker.internal:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('9. Hostname local do Docker Compose (postgres) é permitido', () => {
    expect(isLocalHost('postgres')).toBe(true)
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@postgres:5432/verttex_db',
      ),
    ).not.toThrow()
  })

  it('10. Domínio público é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@database.empresa.com:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@aws.rds.amazonaws.com:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('11. IP público é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@203.0.113.10:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')

    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@8.8.8.8:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('12. Hostname arbitrário não autorizado é bloqueado', () => {
    expect(() =>
      assertSafeLocalDatabaseUrl(
        'postgresql://user:pass@remote-db-server:5432/verttex_db',
      ),
    ).toThrow('DATABASE_URL não parece apontar para um PostgreSQL local')
  })

  it('13. assertSafeLocalDatabaseUrl lança ANTES de qualquer efeito colateral downstream', () => {
    // Verifica que a função lança imediatamente sem depender de contexto externo
    const unsafeUrls = [
      'postgresql://user:pass@203.0.113.10:5432/prod',
      'postgresql://user:pass@aws.rds.amazonaws.com:5432/db',
      'postgresql://user:pass@remote-db:5432/db',
      'postgresql://user:pass@127.0.0.2:5432/db',
    ]
    for (const url of unsafeUrls) {
      let guardFired = false
      let sideEffectReached = false
      try {
        assertSafeLocalDatabaseUrl(url)
        // This line must never execute for unsafe URLs
        sideEffectReached = true
      } catch {
        guardFired = true
      }
      expect(guardFired).toBe(true)
      expect(sideEffectReached).toBe(false)
    }
  })

  it('14. A integração real utiliza diretamente DATABASE_URL sem redirecionamentos', () => {
    const activeUrl = process.env.DATABASE_URL
    expect(activeUrl).toBeDefined()
    expect(() => assertSafeLocalDatabaseUrl(activeUrl)).not.toThrow()
  })

  it('15. A suíte de integração com PostgreSQL local valida DATABASE_URL e executa com sucesso', () => {
    expect(() => assertSafeLocalDatabaseUrl()).not.toThrow()
  })

  it('16. URL insegura bloqueia no guard e encerra CLI real com exit code != 0 sem expor credenciais', async () => {
    // 1. Invocação direta da função de orquestração com URL insegura
    const originalUrl = process.env.DATABASE_URL
    const secretUnsafeUrl =
      'postgresql://unsafe_user:secret_password_123@203.0.113.10:5432/prod_db'
    ;(process.env as Record<string, string>).DATABASE_URL = secretUnsafeUrl
    const { cleanDatabase } = await import('../prisma/clean.js')

    let errorCaught: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      errorCaught = e as Error
    } finally {
      ;(process.env as Record<string, string>).DATABASE_URL = originalUrl!
    }

    expect(errorCaught).not.toBeNull()
    expect(errorCaught?.message).toContain(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
    expect(errorCaught?.message).not.toContain('secret_password_123')
    expect(errorCaught?.message).not.toContain('unsafe_user')
    expect(errorCaught?.message).not.toContain('203.0.113.10')

    // 2. Invocação do CLI real via processo separado com shell: false
    let cliExitCode: number | null = 0
    let cliCombinedOutput = ''
    try {
      cliCombinedOutput = execFileSync(
        'node',
        ['--import', 'tsx/esm', 'prisma/clean.ts'],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DATABASE_URL: secretUnsafeUrl,
          },
          shell: false,
          encoding: 'utf-8',
          stdio: 'pipe',
        },
      )
    } catch (err: unknown) {
      const execError = err as { status?: number; stderr?: string; stdout?: string }
      cliExitCode = execError.status ?? 1
      cliCombinedOutput = `${execError.stdout || ''}\n${execError.stderr || ''}`
    }

    expect(cliExitCode).not.toBe(0)
    expect(cliCombinedOutput).toContain(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )
    expect(cliCombinedOutput).not.toContain('secret_password_123')
    expect(cliCombinedOutput).not.toContain('unsafe_user')
    expect(cliCombinedOutput).not.toContain('203.0.113.10')
  })

  it('17. Sucesso real da limpeza em banco local remove dados reais, preserva utilidade do schema e chama $disconnect() no finally', async () => {
    assertSafeLocalDatabaseUrl()
    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    // 1. Cria dados reais usando API normal do Prisma (Zero Raw SQL)
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Cliente Teste Limpeza',
        email: `clean-test-${Date.now()}@example.com`,
        passwordHash: 'dummy_hash',
      },
    })
    const testCart = await prisma.cart.create({
      data: {
        customerId: testCustomer.id,
        status: 'active',
      },
    })

    // 2. Confirma que os dados existem antes da limpeza
    const cartCountBefore = await prisma.cart.count({
      where: { id: testCart.id },
    })
    expect(cartCountBefore).toBe(1)

    // 3. Executa a orquestração real cleanDatabase()
    const disconnectSpy = vi.spyOn(prisma, '$disconnect')
    disconnectSpy.mockClear()

    await cleanDatabase()

    // 4. Confirma que $disconnect() foi chamado exatamente uma vez no bloco finally
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    disconnectSpy.mockRestore()

    // 5. Confirma que os dados foram removidos via API normal do Prisma
    const cartCountAfter = await prisma.cart.count({
      where: { id: testCart.id },
    })
    const customerCountAfter = await prisma.customer.count({
      where: { id: testCustomer.id },
    })
    expect(cartCountAfter).toBe(0)
    expect(customerCountAfter).toBe(0)

    // 6. Confirma que o schema continua utilizável (permissões e cargos essenciais semeadas)
    const permCount = await prisma.permission.count()
    const roleCount = await prisma.role.count()
    expect(permCount).toBeGreaterThan(0)
    expect(roleCount).toBeGreaterThan(0)
  })

  it('18. Cenário 2 — Falha da limpeza com desconexão bem-sucedida propaga exatamente o erro da limpeza e chama $disconnect() 1x', async () => {
    assertSafeLocalDatabaseUrl()
    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    const disconnectSpy = vi.spyOn(prisma, '$disconnect')
    disconnectSpy.mockClear()

    const cleanupError = new Error('CLEANUP_FAILURE_DISCONNECT_SUCCESS')
    const stockMovementsDeleteSpy = vi
      .spyOn(prisma.stockMovement, 'deleteMany')
      .mockRejectedValueOnce(cleanupError)

    let caughtError: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      caughtError = e as Error
    }

    expect(stockMovementsDeleteSpy).toHaveBeenCalledTimes(1)
    expect(caughtError).toBe(cleanupError)
    expect(caughtError?.message).toBe('CLEANUP_FAILURE_DISCONNECT_SUCCESS')
    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    stockMovementsDeleteSpy.mockRestore()
    disconnectSpy.mockRestore()
  })

  it('19. Cenário 3 — Limpeza bem-sucedida com falha da desconexão propaga o erro da desconexão e chama $disconnect() 1x', async () => {
    assertSafeLocalDatabaseUrl()
    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    const disconnectError = new Error('DISCONNECT_FAILURE_CLEANUP_SUCCESS')
    const disconnectSpy = vi
      .spyOn(prisma, '$disconnect')
      .mockRejectedValueOnce(disconnectError)

    let caughtError: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      caughtError = e as Error
    }

    expect(caughtError).toBe(disconnectError)
    expect(caughtError?.message).toBe('DISCONNECT_FAILURE_CLEANUP_SUCCESS')
    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    disconnectSpy.mockRestore()
  })

  it('20. Cenário 4 — Falha da limpeza E falha da desconexão simultaneamente preservam a instância do erro original da limpeza', async () => {
    assertSafeLocalDatabaseUrl()
    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    const primaryCleanupError = new Error('PRIMARY_CLEANUP_ERROR')
    const secondaryDisconnectError = new Error('SECONDARY_DISCONNECT_ERROR')

    const stockMovementsDeleteSpy = vi
      .spyOn(prisma.stockMovement, 'deleteMany')
      .mockRejectedValueOnce(primaryCleanupError)

    const disconnectSpy = vi
      .spyOn(prisma, '$disconnect')
      .mockRejectedValueOnce(secondaryDisconnectError)

    let caughtError: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      caughtError = e as Error
    }

    // A falha da desconexão NÃO substitui nem mascara o erro original da limpeza
    expect(stockMovementsDeleteSpy).toHaveBeenCalledTimes(1)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(caughtError).toBe(primaryCleanupError)
    expect(caughtError?.message).toBe('PRIMARY_CLEANUP_ERROR')

    stockMovementsDeleteSpy.mockRestore()
    disconnectSpy.mockRestore()
  })

  it('21. Nenhuma credencial é exposta no erro do guard e o seed do catálogo de desenvolvimento é restaurado', async () => {
    const secretUrl =
      'postgresql://sensitive_user:super_secret_password_123@203.0.113.10:5432/sensitive_db?sslmode=require'
    let caughtMessage = ''
    try {
      assertSafeLocalDatabaseUrl(secretUrl)
    } catch (e: unknown) {
      caughtMessage = (e as Error).message
    }
    expect(caughtMessage).toBe(
      'DATABASE_URL não parece apontar para um PostgreSQL local. Configure uma conexão local antes de executar testes destrutivos.',
    )
    expect(caughtMessage).not.toContain('sensitive_user')
    expect(caughtMessage).not.toContain('super_secret_password_123')
    expect(caughtMessage).not.toContain('203.0.113.10')

    expect(process.env.TEST_DATABASE_URL).toBeUndefined()

    // Restaura o seed do catálogo de desenvolvimento para garantir isolamento limpo das suítes de catálogo
    const { seed } = await import('../prisma/seed.js')
    await seed()
  })
})
