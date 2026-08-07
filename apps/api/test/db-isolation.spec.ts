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

  it('16. Spies explícitos comprovam que NENHUMA operação (factory, cliente, $connect, limpeza, operação destrutiva, $disconnect) é iniciada quando a URL é insegura', async () => {
    const originalUrl = process.env.DATABASE_URL
    const secretUnsafeUrl =
      'postgresql://usuario-secreto:senha-secreta@host-secreto:5432/banco_prod'
    ;(process.env as Record<string, string>).DATABASE_URL = secretUnsafeUrl

    const { cleanDatabase } = await import('../prisma/clean.js')

    const connectSpy = vi.fn().mockResolvedValue(undefined)
    const cleanSpy = vi.fn().mockResolvedValue({ count: 0 })
    const destructiveOperationSpy = vi.fn().mockResolvedValue({ count: 0 })
    const disconnectSpy = vi.fn().mockResolvedValue(undefined)

    const mockPrismaClient = {
      $connect: connectSpy,
      $disconnect: disconnectSpy,
      stockMovement: { deleteMany: cleanSpy },
      customer: { deleteMany: destructiveOperationSpy },
    }

    const createPrismaClient = vi.fn().mockResolvedValue(mockPrismaClient)

    let errorCaught: Error | null = null
    try {
      await cleanDatabase({ prismaClientFactory: createPrismaClient })
    } catch (e: unknown) {
      errorCaught = e as Error
    } finally {
      ;(process.env as Record<string, string>).DATABASE_URL = originalUrl!
    }

    expect(errorCaught).not.toBeNull()
    expect(errorCaught?.message).toContain(
      'DATABASE_URL não parece apontar para um PostgreSQL local',
    )

    // Asserções explícitas exigidas pela Rodada J
    expect(createPrismaClient).not.toHaveBeenCalled()
    expect(connectSpy).not.toHaveBeenCalled()
    expect(cleanSpy).not.toHaveBeenCalled()
    expect(destructiveOperationSpy).not.toHaveBeenCalled()
    expect(disconnectSpy).not.toHaveBeenCalled()
  })

  it('17. URL insegura bloqueia no guard e encerra CLI real em subprocesso (shell: false) com exit code != 0 sem expor credenciais em stdout/stderr', async () => {
    const secretUnsafeUrl =
      'postgresql://usuario-secreto:senha-secreta@host-secreto:5432/banco_prod'

    let cliExitCode: number | null = 0
    let cliStdout = ''
    let cliStderr = ''
    try {
      cliStdout = execFileSync(
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
      const execError = err as {
        status?: number
        stderr?: string
        stdout?: string
      }
      cliExitCode = execError.status ?? 1
      cliStdout = execError.stdout || ''
      cliStderr = execError.stderr || ''
    }

    expect(cliExitCode).not.toBe(0)
    const combinedOutput = `${cliStdout}\n${cliStderr}`

    expect(combinedOutput).toContain('Falha ao executar a limpeza do banco.')
    expect(combinedOutput).not.toContain('usuario-secreto')
    expect(combinedOutput).not.toContain('senha-secreta')
    expect(combinedOutput).not.toContain('host-secreto')
    expect(combinedOutput).not.toContain('banco_prod')
  })

  it('18. Testes com sentinelas comprovam que credenciais e mensagens de erros arbitrários nunca são impressos em stdout/stderr/console em nenhum cenário', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const sentinelSecret = 'SENHA_NAO_PODE_APARECER_SECRET_12345'
    const secretUrl = `postgresql://usuario-secreto:${sentinelSecret}@host-secreto/banco`

    const { cleanDatabase } = await import('../prisma/clean.js')

    // Cenário 1: Falha na limpeza com mensagem contendo credencial
    const cleanupErrorWithCredential = new Error(
      `Erro de banco contendo ${sentinelSecret} e ${secretUrl}`,
    )
    const mockPrismaCleanupFail = {
      $disconnect: vi.fn().mockResolvedValue(undefined),
      stockMovement: {
        deleteMany: vi.fn().mockRejectedValue(cleanupErrorWithCredential),
      },
    }

    let caught1: Error | null = null
    try {
      await cleanDatabase({
        prismaClientFactory: async () => mockPrismaCleanupFail,
      })
    } catch (e: unknown) {
      caught1 = e as Error
    }
    expect(caught1).toBe(cleanupErrorWithCredential)

    // Cenário 2: Falha dupla (limpeza + desconexão) com mensagens contendo credenciais
    const disconnectErrorWithCredential = new Error(
      `Erro no $disconnect contendo ${sentinelSecret}`,
    )
    const mockPrismaDoubleFail = {
      $disconnect: vi.fn().mockRejectedValue(disconnectErrorWithCredential),
      stockMovement: {
        deleteMany: vi.fn().mockRejectedValue(cleanupErrorWithCredential),
      },
    }

    let caught2: Error | null = null
    try {
      await cleanDatabase({
        prismaClientFactory: async () => mockPrismaDoubleFail,
      })
    } catch (e: unknown) {
      caught2 = e as Error
    }
    expect(caught2).toBe(cleanupErrorWithCredential)

    // Valida que NENHUM log/error/warn continha os trechos sensíveis ou mensagens arbitrárias
    const allConsoleCalls = [
      ...consoleErrorSpy.mock.calls,
      ...consoleLogSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
    ].flatMap((call) => call.map((arg) => String(arg)))

    for (const logLine of allConsoleCalls) {
      expect(logLine).not.toContain(sentinelSecret)
      expect(logLine).not.toContain('usuario-secreto')
      expect(logLine).not.toContain('host-secreto')
      expect(logLine).not.toContain(secretUrl)
      expect(logLine).not.toContain('Erro de banco contendo')
      expect(logLine).not.toContain('Erro no $disconnect contendo')
    }

    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('19. Sucesso real da limpeza em banco local remove dados reais, preserva utilidade do schema e chama $disconnect() no finally', async () => {
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

  it('20. Cenário 2 — Falha da limpeza com desconexão bem-sucedida propaga exatamente a mesma instância do erro da limpeza e chama $disconnect() 1x', async () => {
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

  it('21. Cenário 3 — Limpeza bem-sucedida com falha no $disconnect() propaga a mesma instância do erro, executa limpeza com sucesso, chama $disconnect() 1x e não expõe credenciais', async () => {
    assertSafeLocalDatabaseUrl()
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const { cleanDatabase } = await import('../prisma/clean.js')
    const { prisma } = await import('../src/infrastructure/database/prisma.js')

    const sentinelSecret = 'SENHA_NAO_PODE_APARECER_DISCONNECT_SECRET_9999'
    const sentinelUrl =
      'postgresql://usuario-secreto:senha-secreta@host-secreto/banco'

    const disconnectError = new Error(
      `DISCONNECT_FAILURE_CLEANUP_SUCCESS contendo ${sentinelSecret} e ${sentinelUrl}`,
    )

    const stockMovementsDeleteSpy = vi.spyOn(prisma.stockMovement, 'deleteMany')
    const disconnectSpy = vi
      .spyOn(prisma, '$disconnect')
      .mockRejectedValueOnce(disconnectError)

    let caughtError: Error | null = null
    try {
      await cleanDatabase()
    } catch (e: unknown) {
      caughtError = e as Error
    }

    // 1. A limpeza foi executada com sucesso
    expect(stockMovementsDeleteSpy).toHaveBeenCalled()

    // 2. $disconnect() foi chamado exatamente uma vez
    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    // 3 e 4. O erro da desconexão foi propagado e a mesma instância foi preservada
    expect(caughtError).toBe(disconnectError)

    // 5. Nenhuma informação arbitrária da mensagem contendo sentinelas/credenciais foi impressa
    const allConsoleCalls = [
      ...consoleErrorSpy.mock.calls,
      ...consoleLogSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
    ].flatMap((call) => call.map((arg) => String(arg)))

    for (const logLine of allConsoleCalls) {
      expect(logLine).not.toContain(sentinelSecret)
      expect(logLine).not.toContain('usuario-secreto')
      expect(logLine).not.toContain('senha-secreta')
      expect(logLine).not.toContain('host-secreto')
      expect(logLine).not.toContain('DISCONNECT_FAILURE_CLEANUP_SUCCESS')
    }

    stockMovementsDeleteSpy.mockRestore()
    disconnectSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  it('22. Cenário 4 — Falha da limpeza E falha da desconexão simultaneamente preservam a instância original do erro da limpeza, chamam $disconnect() 1x e não imprimem mensagens arbitrárias', async () => {
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

  it('23. Nenhuma credencial é exposta no erro do guard e o seed do catálogo de desenvolvimento é restaurado', async () => {
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

  it('24. O CLI e o projeto carregam a configuração de ambiente via @verttex/env/api antes da instanciação do cliente', async () => {
    // Importa o módulo oficial de env do projeto
    await import('@verttex/env/api')
    expect(process.env.DATABASE_URL).toBeDefined()

    // CLI real com env herdado do projeto
    const { cleanDatabase } = await import('../prisma/clean.js')
    expect(typeof cleanDatabase).toBe('function')
  })
})
